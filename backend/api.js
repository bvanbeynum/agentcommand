import { dataLayer } from './data.js';

export const api = {
	getOverview: async (req, res) => {
		const timeRange = req.query.timeRange || '24H';
		const stats = await dataLayer.getAgentStats();
		if (stats.status !== 200) return res.status(stats.status).json(stats);
		
		const throughput = await dataLayer.getThroughputData(timeRange);
		if (throughput.status !== 200) return res.status(throughput.status).json(throughput);

		const recentLogs = await dataLayer.getLogs({}, 10);
		if (recentLogs.status !== 200) return res.status(recentLogs.status).json(recentLogs);

		res.status(200).json({
			status: 200,
			data: {
				stats: stats.data,
				throughput: throughput.data,
				recentLogs: recentLogs.data
			}
		});
	},
	getTasks: async (req, res) => {
		const result = await dataLayer.getTasks(req.query);
		res.status(result.status).json(result);
	},
	getLogs: async (req, res) => {
		const result = await dataLayer.getLogs(req.query, parseInt(req.query.limit) || 100);
		res.status(result.status).json(result);
	},
	getArtifacts: async (req, res) => {
		const result = await dataLayer.getArtifacts(req.query);
		res.status(result.status).json(result);
	},
	getAgents: async (req, res) => {
		const result = await dataLayer.getAgents();
		res.status(result.status).json(result);
	},
	getAgentDetails: async (req, res) => {
		const result = await dataLayer.getAgentDetails(req.params.id);
		res.status(result.status).json(result);
	},
	updateAgent: async (req, res) => {
		const result = await dataLayer.updateAgent(req.params.id, req.body);
		res.status(result.status).json(result);
	},
	createAgent: async (req, res) => {
		const result = await dataLayer.createAgent(req.body);
		res.status(result.status).json(result);
	},
	deleteAgent: async (req, res) => {
		const result = await dataLayer.deleteAgent(req.params.id);
		res.status(result.status).json(result);
	},
	getProjects: async (req, res) => {
		const result = await dataLayer.getProjects();
		res.status(result.status).json(result);
	},
	getProjectDetails: async (req, res) => {
		const result = await dataLayer.getProjectDetails(req.params.id);
		res.status(result.status).json(result);
	},
	createTask: async (req, res) => {
		const result = await dataLayer.createTask(req.body);
		res.status(result.status).json(result);
	},
	updateTask: async (req, res) => {
		const result = await dataLayer.updateTask(req.params.id, req.body);
		res.status(result.status).json(result);
	},
	createSession: async (req, res) => {
		const result = await dataLayer.createSession(req.body);
		res.status(result.status).json(result);
	},
	updateSession: async (req, res) => {
		const result = await dataLayer.updateSession(req.params.id, req.body);
		res.status(result.status).json(result);
	}
};
