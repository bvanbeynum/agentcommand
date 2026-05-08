import React, { useState, useEffect } from 'react';
import MarkdownViewer from './MarkdownViewer.js';

const Projects = () => {
	const [projects, setProjects] = useState([]);
	const [selectedProjectId, setSelectedProjectId] = useState(null);
	const [projectDetails, setProjectDetails] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedArtifact, setSelectedArtifact] = useState(null);
	const [expandedLogIndex, setExpandedLogIndex] = useState(null);
	const [showInitializeModal, setShowInitializeModal] = useState(false);
	const [newProjectName, setNewProjectName] = useState('');
	const [newInstruction, setNewInstruction] = useState('');
	const [selectedTask, setSelectedTask] = useState(null);
	const [clarificationAnswers, setClarificationAnswers] = useState({});
	const [expandedClarificationIndex, setExpandedClarificationIndex] = useState(null);

	const fetchProjects = async () => {
		try {
			const res = await fetch('/api/projects');
			const json = await res.json();
			if (json.status === 200) {
				setProjects(json.data);
			}
		} catch (err) {
			console.error('Failed to fetch projects:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchProjectDetails = async () => {
		if (!selectedProjectId) return;
		try {
			const res = await fetch(`/api/projects/${selectedProjectId}`);
			const json = await res.json();
			if (json.status === 200) {
				setProjectDetails(json.data);
				if (selectedTask) {
					const updatedTask = json.data.tasks.find(t => t.id === selectedTask.id);
					if (updatedTask) setSelectedTask(updatedTask);
				}
			}
		} catch (err) {
			console.error('Failed to fetch project details:', err);
		}
	};

	useEffect(() => {
		fetchProjects();
	}, []);

	useEffect(() => {
		fetchProjectDetails();
		const interval = setInterval(fetchProjectDetails, 5000);
		return () => clearInterval(interval);
	}, [selectedProjectId]);

	const handleAnswerClarification = async (task, index, answer) => {
		if (!answer) return;

		const updatedClarifications = [...task.clarifications];
		updatedClarifications[index] = { ...updatedClarifications[index], answer };

		const userResponses = task.payload.userResponses || [];
		userResponses.push({
			question: updatedClarifications[index].question || updatedClarifications[index].questions,
			answer,
			timestamp: new Date()
		});

		try {
			const res = await fetch(`/api/tasks/${task.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					clarifications: updatedClarifications,
					status: 'pending',
					'payload.userResponses': userResponses
				})
			});
			const json = await res.json();
			if (json.status === 200) {
				setClarificationAnswers(prev => {
					const next = { ...prev };
					delete next[index];
					return next;
				});
				setSelectedTask(json.data);
				fetchProjectDetails();
			}
		} catch (err) {
			console.error('Failed to answer clarification:', err);
		}
	};

	const handleInitializeProject = async () => {
		if (!newProjectName || !newInstruction) return;

		const taskData = {
			to: 'Business Analyst',
			status: 'pending',
			payload: {
				instruction: newInstruction
			},
			metadata: {
				projectName: newProjectName
			},
			created: new Date(),
			startedAt: null,
			clarifications: [],
			completedAt: null,
			result: null
		};

		try {
			const res = await fetch('/api/tasks', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(taskData)
			});
			const json = await res.json();
			if (json.status === 201) {
				setShowInitializeModal(false);
				setNewProjectName('');
				setNewInstruction('');
				fetchProjects();
			}
		} catch (err) {
			console.error('Failed to initialize project:', err);
		}
	};

	const formatDuration = (start, end) => {
		if (!start || !end) return 'PENDING';
		const ms = new Date(end).getTime() - new Date(start).getTime();
		if (ms < 0) return '0s';
		const sec = Math.floor(ms / 1000);
		if (sec < 60) return `${sec}s`;
		const min = Math.floor(sec / 60);
		if (min < 60) return `${min}m ${sec % 60}s`;
		const hr = Math.floor(min / 60);
		return `${hr}h ${min % 60}m`;
	};

	if (loading) {
		return (
			<div className="bento-card">
				<div className="label-caps">Project Matrix Alignment</div>
				<div className="mono-data view-placeholder-text">Loading active initiatives...</div>
			</div>
		);
	}

	return (
		<div className="projects-container">
			<div className="project-matrix-header">
				<div>
					<h1 className="project-matrix-title">Project Matrix</h1>
					<p className="project-matrix-subtitle">ACTIVE INITIATIVES & TELEMETRY ALIGNMENT</p>
				</div>
				<button className="btn-initialize" onClick={() => setShowInitializeModal(true)}>
					<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
					INITIALIZE PROJECT
				</button>
			</div>

			<div className={`grid-container ${selectedProjectId ? 'is-detail-open' : ''}`}>
				{/* Project List Sidebar */}
				<div className="project-sidebar">
					<div className="directory-header">
						<span>ACTIVE DIRECTORY</span>
						<span className="material-symbols-outlined" style={{ fontSize: '14px' }}>filter_list</span>
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
						{projects.map(project => (
							<div 
								key={project.id} 
								className={`bento-card project-card ${selectedProjectId === project.id ? 'project-card-active' : ''}`}
								onClick={() => setSelectedProjectId(project.id)}
							>
								<div className="project-card-header">
									<span className="project-id-label text-primary-cyan" style={{ wordBreak: 'break-all' }}>{project.id}</span>
									<span className={`status-dot ${project.status === 'EXECUTION' ? 'bg-primary-cyan' : 'bg-outline-variant'}`}></span>
								</div>
								<h3 className="headline-md" style={{ fontSize: '16px', margin: '0 0 4px 0' }}>{project.name}</h3>
								<p className="mono-data" style={{ fontSize: '11px', color: 'var(--on-surface-variant)', margin: '0 0 16px 0', wordBreak: 'break-word' }}>
									{project.description}
								</p>
								<div style={{ display: 'flex', gap: '8px' }}>
									<span className="phase-badge">Last Agent: {project.lastAgent}</span>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Drill-Down View */}
				<div className="project-detail-view">
					<div className="mobile-back-btn" onClick={() => setSelectedProjectId(null)}>
						<span className="material-symbols-outlined">arrow_back</span>
						<span className="label-caps" style={{ fontSize: '10px' }}>Back to Directory</span>
					</div>
					{projectDetails ? (
						<>
							<div className="detail-banner">
								<div>
									<div className="project-id-label text-primary-cyan" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-all' }}>
										<span className="material-symbols-outlined" style={{ fontSize: '14px' }}>memory</span>
										{projectDetails.id}
									</div>
									<h2 className="headline-lg project-detail-title" style={{ margin: 0 }}>{projectDetails.name}</h2>
								</div>
								<div style={{ textAlign: 'right' }}>
									<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>WORKING</div>
									<div className="headline-md" style={{ fontSize: '20px' }}>{projectDetails.workingDuration}</div>
								</div>
							</div>

							<div className="project-detail-grid">
								{/* Artifacts */}
								<div className="bento-card">
									<div className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
										<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>folder_open</span>
										PROJECT ARTIFACTS
									</div>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
										{projectDetails.artifacts.length > 0 ? projectDetails.artifacts.map((artifact, i) => (
											<div 
												key={i} 
												className="artifact-item" 
												style={{ cursor: 'pointer' }}
												onClick={() => setSelectedArtifact(artifact)}
											>
												<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
													<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '16px' }}>
														{artifact.type === 'code' ? 'code' : artifact.type === 'design' ? 'design_services' : 'description'}
													</span>
													<span className="mono-data" style={{ fontSize: '12px' }}>{artifact.name}</span>
												</div>
												<span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>open_in_new</span>
											</div>
										)) : (
											<div className="mono-data" style={{ fontSize: '11px', color: 'var(--on-surface-variant)', padding: '8px' }}>No artifacts found</div>
										)}
									</div>
								</div>

								{/* Agents */}
								<div className="bento-card">
									<div className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
										<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group</span>
										ASSIGNED AGENTS
									</div>
									<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
										{projectDetails.agents.length > 0 ? projectDetails.agents.map((agent, i) => (
											<div key={i} className="agent-item">
												<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
													<div className="agent-avatar-small">{agent.id.substring(0, 2).toUpperCase()}</div>
													<div>
														<div className="mono-data" style={{ fontSize: '12px', lineHeight: 1 }}>{agent.role}</div>
														<div className="mono-data" style={{ fontSize: '9px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>
															Last Update: {agent.lastUpdate ? new Date(agent.lastUpdate).toLocaleString() : 'Never'}
														</div>
													</div>
												</div>
												<div className={`status-dot ${agent.status === 'online' ? 'bg-primary-cyan' : 'bg-outline-variant'}`}></div>
											</div>
										)) : (
											<div className="mono-data" style={{ fontSize: '11px', color: 'var(--on-surface-variant)', padding: '8px' }}>No agents assigned</div>
										)}
									</div>
								</div>
							</div>

							{/* Task Matrix */}
							<div className="bento-card table-card">
								<div className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
									<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>checklist</span>
									TASK MATRIX
								</div>
								
								{/* Desktop Table View */}
								<div className="desktop-only scrollable-x">
									<table className="project-table">
										<thead>
											<tr>
												<th className="mono-data" style={{ fontSize: '10px' }}>Date/Time</th>
												<th className="mono-data" style={{ fontSize: '10px' }}>Status</th>
												<th className="mono-data" style={{ fontSize: '10px' }}>Description</th>
												<th className="mono-data" style={{ fontSize: '10px' }}>Assignee</th>
											</tr>
										</thead>
										<tbody>
											{projectDetails.tasks.length > 0 ? projectDetails.tasks.map((task, i) => (
												<tr key={i} onClick={() => setSelectedTask(task)} style={{ cursor: 'pointer' }}>
													<td className="mono-data text-primary-cyan" style={{ fontSize: '12px' }}>{new Date(task.created).toLocaleString()}</td>
													<td className="mono-data" style={{ fontSize: '12px' }}>
														<span style={{ 
															color: task.status === 'done' ? 'var(--primary-cyan)' : (task.status === 'awaiting_user_response' ? '#ff5449' : 'var(--alert-amber)'),
															fontWeight: '600',
															textTransform: 'uppercase',
															fontSize: '10px'
														}}>
															{task.status.replace(/_/g, ' ')}
														</span>
													</td>
													<td className="mono-data" style={{ fontSize: '12px' }}>{task.payload.instruction}</td>
													<td className="mono-data" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{task.to}</td>
												</tr>
											)) : (
												<tr>
													<td colSpan="4" className="mono-data" style={{ textAlign: 'center', padding: '16px', color: 'var(--on-surface-variant)' }}>No tasks recorded</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>

								{/* Mobile Card View */}
								<div className="mobile-only">
									<div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
										{projectDetails.tasks.length > 0 ? projectDetails.tasks.map((task, i) => (
											<div key={i} className="task-mobile-card" onClick={() => setSelectedTask(task)}>
												<div className="flex-justify-between" style={{ marginBottom: '8px' }}>
													<span className="mono-data text-primary-cyan" style={{ fontSize: '10px' }}>{new Date(task.created).toLocaleString()}</span>
													<span style={{ 
														color: task.status === 'done' ? 'var(--primary-cyan)' : (task.status === 'awaiting_user_response' ? '#ff5449' : 'var(--alert-amber)'),
														fontWeight: '600',
														textTransform: 'uppercase',
														fontSize: '9px',
														border: `1px solid ${task.status === 'done' ? 'var(--primary-cyan)' : (task.status === 'awaiting_user_response' ? '#ff5449' : 'var(--alert-amber)')}`,
														padding: '1px 6px',
														borderRadius: '2px'
													}}>
														{task.status.replace(/_/g, ' ')}
													</span>
												</div>
												<div className="mono-data" style={{ fontSize: '12px', marginBottom: '8px', wordBreak: 'break-word' }}>{task.payload.instruction}</div>
												<div className="flex-justify-between">
													<span className="label-caps" style={{ fontSize: '9px', color: 'var(--on-surface-variant)' }}>Assignee:</span>
													<span className="mono-data" style={{ fontSize: '11px' }}>{task.to}</span>
												</div>
											</div>
										)) : (
											<div className="mono-data" style={{ fontSize: '11px', textAlign: 'center', opacity: 0.5 }}>No tasks recorded</div>
										)}
									</div>
								</div>
							</div>

							{/* Work Log Terminal */}
							<section className="terminal-container">
								<div className="terminal-header">
									<span className="mono-data uppercase" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>WORK LOG STREAM :: LIVE</span>
									<div style={{ display: 'flex', gap: '4px' }}>
										<div className="status-pip bg-alert-amber" style={{ opacity: 0.5 }}></div>
										<div className="status-pip bg-primary-cyan" style={{ opacity: 0.8 }}></div>
									</div>
								</div>
								<div className="terminal-log-stream mono-data">
									<div className="flex-gap-8" style={{ marginBottom: '8px' }}>
										<span className="text-primary-cyan">&gt;_</span>
										<span className="terminal-cursor pulse"></span>
									</div>
									{projectDetails.logs?.map((log, i) => {
										const isError = log.level === 'error' || log.message?.toLowerCase().includes('error');
										const accentColor = isError ? '#ff5449' : 'var(--primary-cyan)';
										const bgColor = isError ? 'rgba(255, 84, 73, 0.2)' : 'rgba(0, 174, 239, 0.15)';
										const textColor = isError ? '#ffffff' : '#b0deff';

										return (
											<div 
												key={i} 
												className="log-entry-wrapper"
												style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
												onClick={() => setExpandedLogIndex(expandedLogIndex === i ? null : i)}
											>
												<div className="flex-gap-8" style={{ 
													backgroundColor: expandedLogIndex === i ? (isError ? 'rgba(255, 84, 73, 0.1)' : 'rgba(0, 174, 239, 0.1)') : 'transparent', 
													padding: '2px 4px', 
													borderRadius: '2px',
													alignItems: 'flex-start'
												}}>
													<span style={{ color: 'var(--outline)', flexShrink: 0 }}>[{new Date(log.created).toLocaleTimeString()}]</span>
													{log.projectName && (
														<span style={{ 
															color: 'var(--primary-cyan)', 
															fontSize: '10px', 
															fontWeight: 'bold', 
															border: '1px solid rgba(0, 174, 239, 0.3)',
															padding: '0 4px',
															borderRadius: '2px',
															backgroundColor: 'rgba(0, 174, 239, 0.05)',
															flexShrink: 0,
															alignSelf: 'flex-start',
															marginTop: '2px'
														}}>
															{log.projectName}
														</span>
													)}
													<span style={{ 
														color: isError ? '#ff5449' : '#e6edf3', 
														fontWeight: isError ? '600' : '400',
														wordBreak: 'break-word',
														flex: 1
													}}>{log.message}</span>
												</div>
												{expandedLogIndex === i && log.context && Object.keys(log.context).length > 0 && (
													<div style={{ 
														marginLeft: '24px', 
														padding: '8px 12px', 
														borderLeft: `2px solid ${accentColor}`, 
														color: textColor, 
														fontSize: '11px',
														backgroundColor: bgColor,
														marginTop: '4px',
														marginBottom: '4px',
														borderRadius: '0 4px 4px 0',
														boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.3)'
													}}>
														<span style={{ color: accentColor, fontWeight: 'bold', marginRight: '8px' }}>[LOG_CONTEXT]</span>
														{JSON.stringify(log.context, null, 2)}
													</div>
												)}
											</div>
										);
									})}
									{projectDetails.logs?.length === 0 && <div className="mono-data" style={{ opacity: 0.5 }}>No telemetry signals detected...</div>}
								</div>
							</section>

							{/* Artifact Detail Modal */}
							{selectedArtifact && (
								<div className="modal-overlay" onClick={() => setSelectedArtifact(null)}>
									<div className="modal-content bento-card" onClick={e => e.stopPropagation()}>
										<header className="modal-header">
											<div>
												<h2 className="label-caps" style={{ margin: 0 }}>{selectedArtifact.name}</h2>
												<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', marginTop: '4px' }}>
													UPDATED: {new Date(selectedArtifact.updatedAt).toLocaleString()}
												</div>
											</div>
											<button className="modal-close-btn" onClick={() => setSelectedArtifact(null)}>
												<span className="material-symbols-outlined">close</span>
											</button>
										</header>
										<div className="modal-body scrollable-y">
											<MarkdownViewer content={selectedArtifact.content} />
										</div>
										<footer className="modal-footer">
											<button className="btn-telemetry-filter-active mono-data" onClick={() => setSelectedArtifact(null)}>CLOSE</button>
										</footer>
									</div>
								</div>
							)}

							{/* Task Detail Modal */}
							{selectedTask && (
								<div className="modal-overlay" onClick={() => setSelectedTask(null)}>
									<div className="modal-content bento-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
										<header className="modal-header">
											<div style={{ width: '100%' }}>
												<div className="flex-justify-between" style={{ marginBottom: '8px' }}>
													<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>
														CREATED: {new Date(selectedTask.created).toLocaleString()}
													</div>
													<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>
														STARTED: {selectedTask.startedAt ? new Date(selectedTask.startedAt).toLocaleString() : 'PENDING'}
													</div>
													<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>
														COMPLETED: {selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleString() : 'N/A'}
													</div>
												</div>
												<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
													<h2 className="label-caps" style={{ margin: 0 }}>Task Details</h2>
													<span style={{ 
														backgroundColor: selectedTask.status === 'done' ? 'rgba(0, 174, 239, 0.1)' : (selectedTask.status === 'awaiting_user_response' ? 'rgba(255, 84, 73, 0.1)' : 'rgba(253, 153, 36, 0.1)'),
														color: selectedTask.status === 'done' ? 'var(--primary-cyan)' : (selectedTask.status === 'awaiting_user_response' ? '#ff5449' : 'var(--alert-amber)'),
														border: `1px solid ${selectedTask.status === 'done' ? 'var(--primary-cyan)' : (selectedTask.status === 'awaiting_user_response' ? '#ff5449' : 'var(--alert-amber)')}`,
														padding: '2px 8px',
														fontSize: '10px',
														fontWeight: 'bold',
														borderRadius: '2px',
														textTransform: 'uppercase'
													}}>
														{selectedTask.status.replace(/_/g, ' ')}
													</span>
												</div>
											</div>
											<button className="modal-close-btn" onClick={() => setSelectedTask(null)}>
												<span className="material-symbols-outlined">close</span>
											</button>
										</header>
										<div className="modal-body scrollable-y" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
											<div>
												<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>INSTRUCTION</div>
												<div className="mono-data" style={{ fontSize: '13px', backgroundColor: 'var(--surface-container-low)', padding: '12px', borderLeft: '3px solid var(--primary-cyan)' }}>
													{selectedTask.payload.instruction}
												</div>
											</div>

											<div>
												<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>CLARIFICATIONS</div>
												<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
													{selectedTask.clarifications && selectedTask.clarifications.length > 0 ? selectedTask.clarifications.map((clar, i) => {
														const isExpanded = expandedClarificationIndex === i;
														const questionText = clar.question || clar.questions || '';
														return (
															<div key={i} className="bento-card" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--surface-container-low)' }}>
																<div 
																	onClick={() => setExpandedClarificationIndex(isExpanded ? null : i)}
																	style={{ 
																		padding: '12px', 
																		cursor: 'pointer', 
																		display: 'flex', 
																		justifyContent: 'space-between', 
																		alignItems: 'center',
																		backgroundColor: isExpanded ? 'rgba(0, 174, 239, 0.1)' : 'transparent'
																	}}
																>
																	<div className="mono-data" style={{ fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
																		<span style={{ color: 'var(--primary-cyan)' }}>#{i + 1}</span>
																		<span style={{ opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
																			{questionText.split('\n')[0].substring(0, 80)}...
																		</span>
																	</div>
																	<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
																		{!clar.answer && <span className="status-pip bg-alert-amber pulse"></span>}
																		<span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>
																			{isExpanded ? 'expand_less' : 'expand_more'}
																		</span>
																	</div>
																</div>
																{isExpanded && (
																	<div style={{ padding: '16px', borderTop: '1px solid var(--outline-variant)', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--surface-container-lowest)' }}>
																		<div style={{ 
																			maxHeight: '200px', 
																			overflowY: 'auto', 
																			padding: '12px', 
																			backgroundColor: 'var(--surface-container-low)', 
																			borderLeft: '3px solid var(--primary-cyan)',
																			fontSize: '13px'
																		}}>
																			<MarkdownViewer content={questionText} />
																		</div>
																		
																		{clar.answer ? (
																			<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
																				<div className="mono-data" style={{ padding: '12px', backgroundColor: 'rgba(0, 174, 239, 0.05)', borderRadius: '4px' }}>
																					<div className="label-caps" style={{ fontSize: '9px', color: 'var(--primary-cyan)', marginBottom: '4px' }}>RESPONSE</div>
																					<div style={{ fontSize: '12px', color: 'var(--on-surface)' }}>{clar.answer}</div>
																				</div>
																				<button 
																					className="btn-telemetry-filter mono-data" 
																					style={{ alignSelf: 'flex-end', padding: '4px 12px', fontSize: '10px' }}
																					onClick={() => handleAnswerClarification(selectedTask, i, clar.answer)}
																				>
																					RESUBMIT RESPONSE
																				</button>
																			</div>
																		) : (
																			<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
																				<div className="label-caps" style={{ fontSize: '9px', color: 'var(--alert-amber)' }}>AWAITING RESPONSE</div>
																				<textarea 
																					className="terminal-input mono-data" 
																					style={{ minHeight: '100px', fontSize: '12px', width: '100%' }}
																					placeholder="Provide details to resume task execution..."
																					value={clarificationAnswers[i] || ''}
																					onChange={e => setClarificationAnswers(prev => ({ ...prev, [i]: e.target.value }))}
																				/>
																				<button 
																					className="btn-initialize" 
																					style={{ alignSelf: 'flex-end', padding: '8px 24px' }}
																					onClick={() => handleAnswerClarification(selectedTask, i, clarificationAnswers[i])}
																				>
																					SUBMIT CLARIFICATION
																				</button>
																			</div>
																		)}
																	</div>
																)}
															</div>
														);
													}) : (
														<div className="mono-data" style={{ fontSize: '11px', opacity: 0.5, textAlign: 'center', padding: '24px', border: '1px dashed var(--outline-variant)' }}>
															No active clarification requests.
														</div>
													)}
												</div>
											</div>

											<div>
												<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '8px' }}>RESULT</div>
												<div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
													<div className="mono-data" style={{ fontSize: '12px', backgroundColor: 'var(--surface-container-low)', padding: '16px', borderLeft: '3px solid var(--primary-cyan)', minHeight: '100px', whiteSpace: 'pre-wrap' }}>
														{selectedTask.result ? (
															typeof selectedTask.result === 'string' ? selectedTask.result : JSON.stringify(selectedTask.result, null, 2)
														) : 'Awaiting result...'}
													</div>
												</div>
											</div>
										</div>
										<footer className="modal-footer">
											<button className="btn-telemetry-filter-active mono-data" onClick={() => setSelectedTask(null)}>CLOSE</button>
										</footer>
									</div>
								</div>
							)}

							{/* Initialize Project Modal */}
							{showInitializeModal && (
								<div className="modal-overlay" onClick={() => setShowInitializeModal(false)}>
									<div className="modal-content bento-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
										<header className="modal-header">
											<div>
												<h2 className="label-caps" style={{ margin: 0 }}>Initialize New Project</h2>
												<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', marginTop: '4px' }}>
													ALLOCATING NEURAL RESOURCES
												</div>
											</div>
											<button className="modal-close-btn" onClick={() => setShowInitializeModal(false)}>
												<span className="material-symbols-outlined">close</span>
											</button>
										</header>
										<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
											<div className="flex-column-gap-8">
												<label className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Project Identifier</label>
												<input 
													type="text" 
													className="terminal-input mono-data" 
													placeholder="e.g. PROJECT-PHOENIX" 
													value={newProjectName}
													onChange={e => setNewProjectName(e.target.value)}
												/>
											</div>
											<div className="flex-column-gap-8">
												<label className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Initial Instruction</label>
												<textarea 
													className="terminal-input mono-data" 
													style={{ minHeight: '120px', resize: 'vertical' }}
													placeholder="Describe the project goal..."
													value={newInstruction}
													onChange={e => setNewInstruction(e.target.value)}
												/>
											</div>
										</div>
										<footer className="modal-footer">
											<button className="btn-telemetry-filter mono-data" style={{ marginRight: '12px' }} onClick={() => setShowInitializeModal(false)}>CANCEL</button>
											<button className="btn-initialize" onClick={handleInitializeProject}>EXECUTE INITIALIZATION</button>
										</footer>
									</div>
								</div>
							)}
						</>
					) : (
						<div className="bento-card">
							<div className="label-caps">Project Detail Initialization</div>
							<div className="mono-data view-placeholder-text">Awaiting project selection...</div>
						</div>
					)}
					
					{/* Initialize Project Modal (Fallback for when no project is selected) */}
					{!projectDetails && showInitializeModal && (
						<div className="modal-overlay" onClick={() => setShowInitializeModal(false)}>
							<div className="modal-content bento-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
								<header className="modal-header">
									<div>
										<h2 className="label-caps" style={{ margin: 0 }}>Initialize New Project</h2>
										<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', marginTop: '4px' }}>
											ALLOCATING NEURAL RESOURCES
										</div>
									</div>
									<button className="modal-close-btn" onClick={() => setShowInitializeModal(false)}>
										<span className="material-symbols-outlined">close</span>
									</button>
								</header>
								<div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
									<div className="flex-column-gap-8">
										<label className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Project Identifier</label>
										<input 
											type="text" 
											className="terminal-input mono-data" 
											placeholder="e.g. PROJECT-PHOENIX" 
											value={newProjectName}
											onChange={e => setNewProjectName(e.target.value)}
										/>
									</div>
									<div className="flex-column-gap-8">
										<label className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Initial Instruction</label>
										<textarea 
											className="terminal-input mono-data" 
											style={{ minHeight: '120px', resize: 'vertical' }}
											placeholder="Describe the project goal..."
											value={newInstruction}
											onChange={e => setNewInstruction(e.target.value)}
										/>
									</div>
								</div>
								<footer className="modal-footer">
									<button className="btn-telemetry-filter mono-data" style={{ marginRight: '12px' }} onClick={() => setShowInitializeModal(false)}>CANCEL</button>
									<button className="btn-initialize" onClick={handleInitializeProject}>EXECUTE INITIALIZATION</button>
								</footer>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Projects;
