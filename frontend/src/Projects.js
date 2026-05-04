import React, { useState, useEffect } from 'react';

const Projects = () => {
	const [projects, setProjects] = useState([]);
	const [selectedProjectId, setSelectedProjectId] = useState(null);
	const [projectDetails, setProjectDetails] = useState(null);
	const [loading, setLoading] = useState(true);

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
									<span className="phase-badge">PHASE: {project.status}</span>
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
									<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)', marginBottom: '4px' }}>COMPLETION ESTIMATE</div>
									<div className="headline-md" style={{ fontSize: '20px' }}>{projectDetails.completion}%</div>
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
											<a key={i} href="#" className="artifact-item">
												<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
													<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '16px' }}>
														{artifact.type === 'code' ? 'code' : artifact.type === 'design' ? 'design_services' : 'description'}
													</span>
													<span className="mono-data" style={{ fontSize: '12px' }}>{artifact.name}</span>
												</div>
												<span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>open_in_new</span>
											</a>
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
														<div className="mono-data" style={{ fontSize: '9px', color: 'var(--on-surface-variant)', marginTop: '4px' }}>{agent.id}</div>
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
											<th className="mono-data" style={{ fontSize: '10px' }}>Task ID</th>
											<th className="mono-data" style={{ fontSize: '10px' }}>Description</th>
											<th className="mono-data" style={{ fontSize: '10px' }}>Assignee</th>
											<th className="mono-data" style={{ fontSize: '10px', textAlign: 'right' }}>Status</th>
										</tr>
									</thead>
									<tbody>
										{projectDetails.tasks.length > 0 ? projectDetails.tasks.map((task, i) => (
											<tr key={i}>
												<td className="mono-data text-primary-cyan" style={{ fontSize: '12px' }}>{task.id.substring(0, 7)}</td>
												<td className="mono-data" style={{ fontSize: '12px' }}>{task.payload.instruction}</td>
												<td className="mono-data" style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>{task.to}</td>
												<td className="mono-data" style={{ fontSize: '12px', textAlign: 'right', color: task.status === 'done' ? 'var(--primary-cyan)' : 'var(--alert-amber)' }}>
													{task.status.toUpperCase()}
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

							{/* Logs */}
							<div className="bento-card dark-bento-card">
								<div className="dark-card-header">
									<div className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>terminal</span>
										PROJECT_SPECIFIC_LOGS
									</div>
									<span className="mono-data text-primary-cyan" style={{ fontSize: '10px' }}>FILTER: {projectDetails.id}</span>
								</div>
								<div className="project-log-stream">
									{projectDetails.logs.length > 0 ? projectDetails.logs.map((log, i) => (
										<div key={i} style={{ display: 'flex', gap: '16px' }}>
											<span style={{ color: 'var(--surface-variant)', opacity: 0.5 }}>{new Date(log.created).toLocaleTimeString()}</span>
											<span className={log.level === 'error' ? 'text-alert-amber' : 'text-primary-cyan'}>[{log.level.toUpperCase()}]</span>
											<span style={{ color: 'var(--surface-container-highest)' }}>{log.message}</span>
										</div>
									)) : (
										<div className="mono-data" style={{ opacity: 0.5 }}>No telemetry signals detected...</div>
									)}
								</div>
							</div>
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
