import React, { useState, useEffect } from 'react';
import MarkdownViewer from './MarkdownViewer.js';

const Projects = () => {
	const [projects, setProjects] = useState([]);
	const [selectedProjectId, setSelectedProjectId] = useState(null);
	const [projectDetails, setProjectDetails] = useState(null);
	const [loading, setLoading] = useState(true);
	const [selectedArtifact, setSelectedArtifact] = useState(null);
	const [expandedLogIndex, setExpandedLogIndex] = useState(null);

	useEffect(() => {
		const fetchProjects = async () => {
			try {
				const res = await fetch('/api/projects');
				const json = await res.json();
				if (json.status === 200) {
					setProjects(json.data);
					if (json.data.length > 0 && !selectedProjectId) {
						setSelectedProjectId(json.data[0].id);
					}
				}
			} catch (err) {
				console.error('Failed to fetch projects:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchProjects();
	}, []);

	useEffect(() => {
		if (selectedProjectId) {
			const fetchProjectDetails = async () => {
				try {
					const res = await fetch(`/api/projects/${selectedProjectId}`);
					const json = await res.json();
					if (json.status === 200) {
						setProjectDetails(json.data);
					}
				} catch (err) {
					console.error('Failed to fetch project details:', err);
				}
			};
			fetchProjectDetails();
			const interval = setInterval(fetchProjectDetails, 5000);
			return () => clearInterval(interval);
		}
	}, [selectedProjectId]);

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
				<button className="btn-initialize">
					<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
					INITIALIZE PROJECT
				</button>
			</div>

			<div className="grid-container">
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
									<span className="project-id-label text-primary-cyan">{project.id}</span>
									<span className={`status-dot ${project.status === 'EXECUTION' ? 'bg-primary-cyan' : 'bg-outline-variant'}`}></span>
								</div>
								<h3 className="headline-md" style={{ fontSize: '16px', margin: '0 0 4px 0' }}>{project.name}</h3>
								<p className="mono-data" style={{ fontSize: '11px', color: 'var(--on-surface-variant)', margin: '0 0 16px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
					{projectDetails ? (
						<>
							<div className="detail-banner">
								<div>
									<div className="project-id-label text-primary-cyan" style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
										<span className="material-symbols-outlined" style={{ fontSize: '14px' }}>memory</span>
										{projectDetails.id}
									</div>
									<h2 className="headline-lg" style={{ fontSize: '24px', margin: 0 }}>{projectDetails.name}</h2>
								</div>
								<div style={{ textAlign: 'right' }}>
									<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>WORKING</div>
									<div className="headline-md" style={{ fontSize: '20px' }}>{projectDetails.workingDuration}</div>
								</div>
							</div>

							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
							<div className="bento-card">
								<div className="label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--outline-variant)', paddingBottom: '8px' }}>
									<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>checklist</span>
									TASK MATRIX
								</div>
								<table className="project-table">
									<thead>
										<tr>
											<th className="mono-data" style={{ fontSize: '10px' }}>Date/Time</th>
											<th className="mono-data" style={{ fontSize: '10px' }}>Description</th>
											<th className="mono-data" style={{ fontSize: '10px' }}>Assignee</th>
											<th className="mono-data" style={{ fontSize: '10px', textAlign: 'right' }}>Time Taken</th>
										</tr>
									</thead>
									<tbody>
										{projectDetails.tasks.length > 0 ? projectDetails.tasks.map((task, i) => (
											<tr key={i}>
												<td className="mono-data text-primary-cyan" style={{ fontSize: '12px' }}>{new Date(task.created).toLocaleString()}</td>
												<td className="mono-data" style={{ fontSize: '12px' }}>{task.payload.instruction}</td>
												<td className="mono-data" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{task.to}</td>
												<td className="mono-data" style={{ fontSize: '12px', textAlign: 'right', color: task.status === 'done' ? 'var(--primary-cyan)' : 'var(--alert-amber)' }}>
													{formatDuration(task.startedAt || task.created, task.completedAt)}
												</td>
											</tr>
										)) : (
											<tr>
												<td colSpan="4" className="mono-data" style={{ textAlign: 'center', padding: '16px', color: 'var(--on-surface-variant)' }}>No tasks recorded</td>
											</tr>
										)}
									</tbody>
								</table>
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
												<div className="flex-gap-8" style={{ backgroundColor: expandedLogIndex === i ? (isError ? 'rgba(255, 84, 73, 0.1)' : 'rgba(0, 174, 239, 0.1)') : 'transparent', padding: '2px 4px', borderRadius: '2px' }}>
													<span style={{ color: 'var(--outline)' }}>[{new Date(log.created).toLocaleTimeString()}]</span>
													<span style={{ color: isError ? '#ff5449' : '#e6edf3', fontWeight: isError ? '600' : '400' }}>{log.message}</span>
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
						</>
					) : (
						<div className="bento-card">
							<div className="label-caps">Project Detail Initialization</div>
							<div className="mono-data view-placeholder-text">Awaiting project selection...</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Projects;
