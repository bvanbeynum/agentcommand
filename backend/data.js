import mongoose from 'mongoose';
import { config } from '../config.js';

const { Schema } = mongoose;

const taskSchema = new Schema({
	to: { type: String, required: true },
	from: { type: String, required: true },
	status: { type: String, default: 'pending' },
	payload: { type: Object, required: true },
	metadata: { type: Object, default: {} },
	clarifications: { type: Array, default: [] },
	result: { type: Object },
	startedAt: { type: Date },
	completedAt: { type: Date },
	created: { type: Date, default: Date.now }
}, { collection: 'tasks' });

const logSchema = new Schema({
	taskId: { type: String, ref: 'Task' },
	agentRole: { type: String, required: true },
	level: { type: String, required: true },
	message: { type: String, required: true },
	context: { type: Object, default: {} },
	created: { type: Date, default: Date.now }
}, { collection: 'agentLogs' });

const artifactSchema = new Schema({
	projectName: { type: String, required: true },
	artifactName: { type: String, required: true },
	content: { type: Schema.Types.Mixed, required: true },
	taskId: { type: String, ref: 'Task' },
	agentRole: { type: String },
	metadata: { type: Object, default: {} },
	updatedAt: { type: Date },
	created: { type: Date, default: Date.now }
}, { collection: 'artifacts' });

const Task = mongoose.model('Task', taskSchema);
const Log = mongoose.model('Log', logSchema);
const Artifact = mongoose.model('Artifact', artifactSchema);

const sanitize = (doc) => {
	if (!doc) return doc;
	if (Array.isArray(doc)) return doc.map(sanitize);
	const sanitized = { ...doc };
	if (sanitized._id) {
		sanitized.id = sanitized._id.toString();
		// Fallback for date if 'created' is missing
		if (!sanitized.created) {
			sanitized.created = sanitized.createdAt || (typeof sanitized._id.getTimestamp === 'function' ? sanitized._id.getTimestamp() : new Date());
		}
		delete sanitized._id;
	}
	if (sanitized.taskId && sanitized.taskId instanceof mongoose.Types.ObjectId) {
		sanitized.taskId = sanitized.taskId.toString();
	}
	delete sanitized.__v;
	return sanitized;
};

const formatDuration = (ms) => {
	if (!ms || ms < 0) return '0s';
	const sec = Math.floor(ms / 1000);
	if (sec < 60) return `${sec}s`;
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ${sec % 60}s`;
	const hr = Math.floor(min / 60);
	if (hr < 24) return `${hr}h ${min % 60}m`;
	const day = Math.floor(hr / 24);
	return `${day}d ${hr % 24}h`;
};

export const connectDB = async () => {
	try {
		await mongoose.connect(config.db.uri, {
			...config.db.options,
			dbName: config.db.dbName
		});
		console.log(`[${new Date().toISOString()}] [Data Layer] Connected to MongoDB: ${config.db.dbName}`);
	} catch (error) {
		console.error(`[${new Date().toISOString()}] [Data Layer] MongoDB Connection Error:`, error.message);
		process.exit(1);
	}
};

export const disconnectDB = async () => {
	await mongoose.disconnect();
	console.log(`[${new Date().toISOString()}] [Data Layer] Disconnected from MongoDB`);
};

export const dataLayer = {
	getTasks: async (filter = {}) => {
		try {
			const data = await Task.find(filter).sort({ created: -1 }).lean().exec();
			return { status: 200, data: sanitize(data) };
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getLogs: async (filter = {}, limit = 100) => {
		try {
			// Use aggregation to join with tasks and get projectName
			const pipeline = [
				{ $match: filter },
				{ $sort: { created: -1 } },
				{ $limit: limit },
				{
					$lookup: {
						from: 'tasks',
						let: { tId: '$taskId' },
						pipeline: [
							{ $match: { $expr: { $eq: [ { $toString: '$_id' }, '$$tId' ] } } }
						],
						as: 'task'
					}
				},
				{ $unwind: { path: '$task', preserveNullAndEmptyArrays: true } },
				{
					$addFields: {
						projectName: '$task.metadata.projectName'
					}
				},
				{ $project: { task: 0 } }
			];
			const data = await Log.aggregate(pipeline).exec();
			return { status: 200, data: sanitize(data) };
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getArtifacts: async (filter = {}) => {
		try {
			const data = await Artifact.find(filter).sort({ created: -1 }).lean().exec();
			return { status: 200, data: sanitize(data) };
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getAgents: async () => {
		try {
			const agents = await Task.distinct('to').exec();
			const activeTasks = await Task.find({ status: 'active' }).select('to').exec();
			const activeAgentRoles = activeTasks.map(t => t.to);

			const roster = agents.map(role => ({
				id: role,
				role: role.toUpperCase(),
				status: activeAgentRoles.includes(role) ? 'online' : 'offline'
			}));

			return { status: 200, data: roster };
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getAgentDetails: async (role) => {
		try {
			const rawTasks = await Task.find({ to: role }).sort({ created: -1 }).limit(20).lean().exec();
			const tasks = sanitize(rawTasks);

			// Use the enhanced getLogs logic for consistency
			const logsResult = await dataLayer.getLogs({ agentRole: role }, 50);
			const logs = logsResult.status === 200 ? logsResult.data : [];

			// Infer artifacts from taskId or agentRole
			const artifacts = await Artifact.find({ 
				$or: [
					{ agentRole: role },
					{ taskId: { $in: rawTasks.map(t => t._id.toString()) } }
				]
			}).sort({ created: -1 }).lean().exec();

			// Construct history (projects they've worked on)
			const projectHistory = Array.from(new Set(tasks.map(t => t.metadata?.projectName).filter(Boolean))).map(projectName => {
				const projectTasks = tasks.filter(t => t.metadata?.projectName === projectName);
				const status = projectTasks.some(t => t.status === 'active') ? 'ACTIVE' : 'COMPLETED';
				return { id: projectName, status };
			});

			return {
				status: 200,
				data: {
					id: role,
					role: role.toUpperCase(),
					created: tasks.length > 0 ? tasks[tasks.length - 1].created : new Date(),
					lastActivity: tasks.length > 0 ? tasks[0].created : new Date(),
					project: tasks.length > 0 ? tasks[0].metadata?.projectName : 'NONE',
					history: projectHistory,
					artifacts: sanitize(artifacts).map(a => ({ 
						name: a.artifactName, 
						type: 'description',
						content: a.content,
						updatedAt: a.updatedAt || a.created
					})),
					tasks: tasks.map(t => ({
						id: t.metadata?.projectName || 'TASK',
						desc: t.payload.instruction,
						time: t.created,
						active: t.status === 'active',
						payload: t.payload,
						metadata: t.metadata
					})),
					recentLogs: logs
				}
			};
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getAgentStats: async () => {
		try {
			// Basic stats
			const totalAgents = await Task.distinct('to').exec();
			const activeTasks = await Task.countDocuments({ status: 'active' }).exec();
			const completed24h = await Task.countDocuments({ 
				status: 'done', 
				completedAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
			}).exec();
			const historicalTasksCompleted = await Task.countDocuments({ status: 'done' }).exec();

			// Top Agents
			const topAgentsRaw = await Task.aggregate([
				{ $match: { status: 'done' } },
				{ $group: { _id: '$to', count: { $sum: 1 } } },
				{ $sort: { count: -1 } },
				{ $limit: 5 }
			]).exec();

			const maxCount = topAgentsRaw.length > 0 ? topAgentsRaw[0].count : 1;
			const topAgents = topAgentsRaw.map(a => ({
				id: a._id,
				percentage: Math.round((a.count / maxCount) * 100)
			}));

			// Active Project Queue
			const projectQueue = await Task.aggregate([
				{ $sort: { created: -1 } },
				{ $group: {
					_id: '$metadata.projectName',
					agents: { $addToSet: '$to' },
					lastUpdate: { $first: '$created' },
					status: { $first: '$status' }
				}},
				{ $limit: 10 },
				{ $sort: { lastUpdate: -1 } }
			]).exec();

			// Resource Matrix (Matrix of Agents vs Projects)
			// We'll get the last 5 active projects and cross-reference with top agents or all agents
			const recentProjects = projectQueue.slice(0, 5).map(p => p._id).filter(Boolean);
			const matrixData = await Task.aggregate([
				{ $match: { 'metadata.projectName': { $in: recentProjects } } },
				{ $group: {
					_id: { agent: '$to', project: '$metadata.projectName' },
					lastInteraction: { $max: '$created' }
				}}
			]).exec();

			const resourceMatrix = {
				projects: recentProjects,
				agents: totalAgents.slice(0, 5), // Limit to top 5 for UI consistency
				assignments: matrixData.map(m => ({
					agent: m._id.agent,
					project: m._id.project,
					lastInteraction: m.lastInteraction
				}))
			};

			return { 
				status: 200, 
				data: {
					totalAgents: totalAgents.length,
					activeTasks,
					completed24h,
					historicalTasksCompleted,
					topAgents,
					activeProjects: projectQueue.map(p => ({
						id: p._id || 'UNNAMED',
						allocation: p.agents.length,
						lastUpdate: p.lastUpdate,
						status: p.status === 'active' ? 'ACTIVE' : (p.status === 'done' ? 'COMPLETED' : 'QUEUE')
					})),
					resourceMatrix
				} 
			};
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getProjects: async () => {
		try {
			const projects = await Task.aggregate([
				{ $sort: { created: -1 } },
				{ $group: {
					_id: '$metadata.projectName',
					id: { $first: '$metadata.projectName' },
					lastUpdate: { $max: '$created' },
					status: { $first: '$status' },
					description: { $first: '$payload.instruction' },
					lastAgent: { $first: '$to' }
				}},
				{ $sort: { lastUpdate: -1 } }
			]).exec();

			return { 
				status: 200, 
				data: projects.filter(p => p._id).map(p => ({
					id: p.id || 'PRJ-UNK',
					name: p.id || 'Unknown Project',
					description: p.description || 'No description available',
					status: p.status === 'active' ? 'EXECUTION' : (p.status === 'done' ? 'COMPLETED' : 'PLANNING'),
					lastUpdate: p.lastUpdate,
					lastAgent: p.lastAgent || 'SYSTEM'
				}))
			};
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getProjectDetails: async (projectId) => {
		try {
			const tasks = await Task.find({ 'metadata.projectName': projectId }).sort({ created: -1 }).lean().exec();
			const taskIds = tasks.map(t => t._id.toString());

			// Use aggregation for logs to ensure we get projectName and correctly match string taskIds
			const logsResult = await dataLayer.getLogs({
				$or: [
					{ taskId: { $in: taskIds } },
					{ 'context.projectName': projectId }
				]
			}, 50);
			const logs = logsResult.status === 200 ? logsResult.data : [];

			const artifacts = await Artifact.find({ projectName: projectId }).sort({ created: -1 }).lean().exec();

			const agents = Array.from(new Set(tasks.map(t => t.to))).map(role => {
				const latestAgentTask = tasks.find(t => t.to === role);
				return {
					id: role,
					role: role.toUpperCase(),
					status: tasks.some(t => t.to === role && t.status === 'active') ? 'online' : 'offline',
					lastUpdate: latestAgentTask ? latestAgentTask.created : null
				};
			});

			let totalWorkTimeMs = 0;
			tasks.forEach(task => {
				if (task.startedAt && task.completedAt) {
					totalWorkTimeMs += (new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime());
				}
			});
			const workingDuration = formatDuration(totalWorkTimeMs);

			return {
				status: 200,
				data: {
					id: projectId,
					name: projectId,
					workingDuration,
					tasks: sanitize(tasks),
					logs: logs,
					artifacts: sanitize(artifacts).map(a => ({
						name: a.artifactName,
						type: a.metadata?.type || 'description',
						content: a.content,
						updatedAt: a.updatedAt || a.created
					})),
					agents
				}
			};
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	getThroughputData: async (timeRange = '24H') => {
		try {
			let hours = 24;
			let buckets = 12;
			if (timeRange === '1H') { hours = 1; buckets = 12; }
			else if (timeRange === '12H') { hours = 12; buckets = 12; }
			else if (timeRange === '7D') { hours = 24 * 7; buckets = 14; }

			const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
			const bucketSizeMs = (hours * 60 * 60 * 1000) / buckets;

			const throughputRaw = await Task.aggregate([
				{ $match: { 
					status: 'done', 
					completedAt: { $gt: startTime } 
				}},
				{ $bucket: {
					groupBy: '$completedAt',
					boundaries: Array.from({ length: buckets + 1 }, (_, i) => new Date(startTime.getTime() + i * bucketSizeMs)),
					default: 'other',
					output: { count: { $sum: 1 } }
				}}
			]).exec();

			// Ensure all buckets are represented even if 0
			const throughput = Array.from({ length: buckets }, (_, i) => {
				const boundary = new Date(startTime.getTime() + i * bucketSizeMs);
				const match = throughputRaw.find(t => t._id.getTime() === boundary.getTime());
				return match ? match.count : 0;
			});

			return { status: 200, data: throughput };
		} catch (error) {
			return { status: 560, error: error.message };
		}
	},
	createTask: async (taskData) => {
		try {
			const task = new Task({
				from: 'User',
				...taskData
			});
			const savedTask = await task.save();
			return { status: 201, data: sanitize(savedTask.toObject()) };
		} catch (error) {
			return { status: 560, error: error.message };
		}
	}
};
