import React, { useState, useEffect } from 'react';

const Sidebar = ({ currentView, setView }) => (
	<nav className="sidebar">
		<div className="sidebar-header">
			<div>
				<div className="label-caps sidebar-admin-label">System Administrator</div>
				<div className="text-lg uppercase sidebar-glados-brand">GLaDOS</div>
				<div className="mono-data sidebar-node-control">NEURAL NODE CONTROL</div>
			</div>
		</div>
		<div className="nav-tabs">
			<a 
				href="#" 
				className={`nav-tab ${currentView === 'overview' ? 'active' : ''}`}
				onClick={(e) => { e.preventDefault(); setView('overview'); }}
			>
				<span className="material-symbols-outlined">dashboard</span>
				<span className="label-caps" style={{ fontSize: '11px' }}>Overview</span>
			</a>
			<a 
				href="#" 
				className={`nav-tab ${currentView === 'agents' ? 'active' : ''}`}
				onClick={(e) => { e.preventDefault(); setView('agents'); }}
			>
				<span className="material-symbols-outlined">precision_manufacturing</span>
				<span className="label-caps" style={{ fontSize: '11px' }}>Agents</span>
			</a>
			<a 
				href="#" 
				className={`nav-tab ${currentView === 'projects' ? 'active' : ''}`}
				onClick={(e) => { e.preventDefault(); setView('projects'); }}
			>
				<span className="material-symbols-outlined">grid_view</span>
				<span className="label-caps" style={{ fontSize: '11px' }}>Project Matrix</span>
			</a>
		</div>
		<div className="sidebar-footer">
			<a href="#" className="nav-tab">
				<span className="material-symbols-outlined">terminal</span>
				<span className="label-caps" style={{ fontSize: '10px' }}>Logs</span>
			</a>
		</div>
	</nav>
);

const Header = () => (
	<header className="top-header">
		<div className="header-brand-container">
			<span className="header-brand-text">AI COMMAND CENTER</span>
		</div>
		<div className="header-actions">
			<div className="status-container">
				<div className="status-pip bg-primary-cyan pulse"></div>
				<span className="mono-data status-text">STATUS: OPTIMAL</span>
			</div>
			<div className="header-icons">
				<span className="material-symbols-outlined header-icon">settings</span>
				<span className="material-symbols-outlined header-icon notification-container">
					notifications
					<span className="notification-dot"></span>
				</span>
			</div>
		</div>
	</header>
);

const Overview = ({ data, timeRange, setTimeRange }) => {
	const { stats, throughput } = data;
	
	const formatRelativeTime = (date) => {
		if (!date) return 'Queue';
		const diff = Math.floor((new Date() - new Date(date)) / 1000);
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		return new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	};

	return (
		<div className="grid-container">
			{/* Stat Cards */}
			<div className="bento-card stat-card stat-card-span-3">
				<div className="stat-card-header">
					<span className="label-caps">Total Agents</span>
					<span className="material-symbols-outlined stat-card-icon">memory</span>
				</div>
				<div className="mono-data stat-card-value">{stats?.totalAgents || 0}</div>
			</div>
			<div className="bento-card stat-card stat-card-span-3 stat-card-active">
				<div className="stat-card-header">
					<span className="label-caps text-primary-cyan">Active</span>
					<div className="sync-container">
						<div className="status-pip bg-primary-cyan"></div>
						<span className="mono-data sync-text">SYNC</span>
					</div>
				</div>
				<div className="mono-data stat-card-value">{stats?.activeTasks || 0}</div>
			</div>
			<div className="bento-card stat-card stat-card-span-3">
				<div className="stat-card-header">
					<span className="label-caps">Active Projects (24H)</span>
					<span className="material-symbols-outlined stat-card-icon">folder</span>
				</div>
				<div className="mono-data stat-card-value">03</div>
			</div>
			<div className="bento-card stat-card stat-card-span-3">
				<div className="stat-card-header">
					<span className="label-caps text-primary-cyan">Completed Tasks (24H)</span>
					<span className="material-symbols-outlined stat-card-icon-primary">check_circle</span>
				</div>
				<div className="mono-data stat-card-value">{stats?.completed24h || 0}</div>
			</div>

			{/* System Throughput */}
			<div className="bento-card chart-card">
				 <div className="card-header-flex">
						<div className="flex-center-gap-8">
								<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>monitoring</span>
								<span className="label-caps">System Throughput</span>
								<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
									<span className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Historical Tasks Completed:</span>
									<span className="mono-data" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-cyan)' }}>{stats?.historicalTasksCompleted?.toLocaleString() || 0}</span>
								</div>
						</div>
						<div className="flex-gap-8" style={{ marginLeft: '16px' }}>
								{['1H', '12H', '24H', '7D'].map(range => (
									<button 
										key={range}
										onClick={() => setTimeRange(range)}
										className={`mono-data ${timeRange === range ? 'btn-telemetry-filter-active' : 'btn-telemetry-filter'}`}
									>
										{range}
									</button>
								))}
						</div>
				 </div>
				 <div className="histogram-container">
						{throughput && throughput.length > 0 ? (
							throughput.map((count, i) => {
								const max = Math.max(...throughput, 1);
								const h = Math.max((count / max) * 100, 2);
								
								// Calculate time for this bar
								let hours = 24;
								if (timeRange === '1H') hours = 1;
								else if (timeRange === '12H') hours = 12;
								else if (timeRange === '7D') hours = 24 * 7;
								
								const buckets = throughput.length;
								const bucketSizeMs = (hours * 60 * 60 * 1000) / buckets;
								const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
								const barTime = new Date(startTime.getTime() + i * bucketSizeMs);

								return (
									<div key={i} className="histogram-bar-wrapper group">
										<div className="histogram-bar" style={{ height: `${h}%` }}></div>
										<div className="histogram-tooltip">
											<div className="mono-data" style={{ fontSize: '12px', fontWeight: 'bold' }}>{count} Tasks</div>
											<div className="mono-data" style={{ fontSize: '10px', opacity: 0.8 }}>
												{barTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												{timeRange === '7D' ? ` ${barTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}
											</div>
										</div>
									</div>
								);
							})
						) : (
							[40, 65, 80, 55, 70, 45, 30, 60, 85, 75, 90, 50].map((h, i) => (
								<div key={i} className="histogram-bar" style={{ height: `${h}%`, opacity: 0.3 }}></div>
							))
						)}
				 </div>
				 <div className="histogram-x-axis">
						<span className="mono-data">
							{(() => {
								let hours = 24;
								if (timeRange === '1H') hours = 1;
								else if (timeRange === '12H') hours = 12;
								else if (timeRange === '7D') hours = 24 * 7;
								const t = new Date(Date.now() - hours * 60 * 60 * 1000);
								return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
							})()}
						</span>
						<span className="mono-data">
							{(() => {
								let hours = 24;
								if (timeRange === '1H') hours = 1;
								else if (timeRange === '12H') hours = 12;
								else if (timeRange === '7D') hours = 24 * 7;
								const t = new Date(Date.now() - (hours / 2) * 60 * 60 * 1000);
								return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
							})()}
						</span>
						<span className="mono-data">NOW</span>
				 </div>
			</div>

			{/* Top Agent Activity */}
			<div className="bento-card activity-card">
				<div className="card-header-flex">
					<span className="label-caps">Top Agent Activity</span>
					<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>leaderboard</span>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
					{stats?.topAgents?.map((agent, i) => (
						<div key={i} className="activity-row">
							<div className="activity-row-label mono-data" style={{ fontSize: '12px' }}>
								<span>{agent.id}</span>
								<span className="text-primary-cyan">{agent.percentage}%</span>
							</div>
							<div className="progress-track">
								<div className="progress-fill" style={{ width: `${agent.percentage}%`, opacity: 1 - (i * 0.15) }}></div>
							</div>
						</div>
					))}
					{(!stats?.topAgents || stats.topAgents.length === 0) && <div className="mono-data" style={{ color: 'var(--outline-variant)', textAlign: 'center' }}>No active telemetry...</div>}
				</div>
			</div>

			{/* Active Project Queue */}
			<div className="bento-card table-card">
				<div className="card-header-flex" style={{ padding: '16px', margin: 0 }}>
					<span className="label-caps">Active Project Queue</span>
					<button className="mono-data" style={{ fontSize: '10px', border: '1px solid var(--outline-variant)', padding: '4px 12px' }}>VIEW ALL</button>
				</div>
				<table className="project-table">
					<thead>
						<tr>
							<th style={{ width: '40px', textAlign: 'center' }}>STS</th>
							<th>PROJECT ID</th>
							<th>ALLOCATION</th>
							<th style={{ textAlign: 'right' }}>LAST UPDATE</th>
						</tr>
					</thead>
					<tbody className="mono-data">
						{stats?.activeProjects?.slice(0, 5).map((project, i) => (
							<tr key={i}>
								<td style={{ textAlign: 'center' }}>
									<div className={`status-indicator status-${project.status.toLowerCase()}`}></div>
								</td>
								<td style={{ fontWeight: '600' }}>{project.id}</td>
								<td style={{ color: 'var(--outline)' }}>{project.allocation} Tasks</td>
								<td style={{ textAlign: 'right', color: 'var(--outline)' }}>{formatRelativeTime(project.lastUpdate)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Resource Matrix */}
			<div className="bento-card matrix-card">
				<div className="card-header-flex">
					<span className="label-caps">Resource Matrix</span>
					<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>apps</span>
				</div>
				<div className="matrix-container">
					<div className="matrix-grid" style={{ gridTemplateColumns: `40px repeat(${stats?.resourceMatrix?.projects?.length || 5}, 1fr)` }}>
						{/* Headers */}
						<div></div>
						{stats?.resourceMatrix?.projects?.map((p, i) => (
							<div key={i} className="matrix-header-cell mono-data">{p.charAt(0)}</div>
						))}
						
						{/* Rows */}
						{stats?.resourceMatrix?.agents?.map((agent, i) => (
							<React.Fragment key={i}>
								<div className="matrix-row-label mono-data">{agent.split('-').pop()}</div>
								{stats.resourceMatrix.projects.map((project, j) => {
									const assignment = stats.resourceMatrix.assignments.find(a => a.agent === agent && a.project === project);
									let cellClass = "";
									if (assignment) {
										const diff = (new Date() - new Date(assignment.lastInteraction)) / 1000;
										if (diff < 300) cellClass = "matrix-cell-active";
										else if (diff < 3600) cellClass = "matrix-cell-warm";
										else cellClass = "matrix-cell-stale";
									}
									return <div key={j} className={`matrix-cell ${cellClass}`}></div>;
								})}
							</React.Fragment>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

const MarkdownViewer = ({ content }) => {
	// Simple Markdown to HTML converter
	const parseMarkdown = (md) => {
		if (!md) return '';
		
		const codeBlocks = [];
		let html = md.replace(/```(?:[a-z]*)?\n([\s\S]*?)```/gim, (match, code) => {
			const id = codeBlocks.length;
			codeBlocks.push(`<pre className="mono-data"><code>${code}</code></pre>`);
			return `___CODE_BLOCK_${id}___`;
		});

		// 2. Tables
		const lines = html.split('\n');
		let inTable = false;
		
		const processedLines = lines.map(line => {
			const trimmed = line.trim();
			if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
				const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
				if (!inTable) {
					inTable = true;
					return `<table className="markdown-table"><thead><tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
				} else if (trimmed.includes('---')) {
					return ''; // Skip the divider line
				} else {
					return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
				}
			} else {
				if (inTable) {
					inTable = false;
					return '</tbody></table>' + line;
				}
				return line;
			}
		});
		
		html = processedLines.filter(l => l !== '').join('\n');
		if (inTable) html += '</tbody></table>';

		// 3. Bullets
		html = html.replace(/^[ \t]*\* (.*$)/gim, '<ul><li>$1</li></ul>');
		html = html.replace(/<\/ul>\n<ul>/gim, ''); 

		// 4. Inline formatting & Headers
		html = html
			.replace(/^### (.*$)/gim, '<h3>$1</h3>')
			.replace(/^## (.*$)/gim, '<h2>$1</h2>')
			.replace(/^# (.*$)/gim, '<h1>$1</h1>')
			.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
			.replace(/\*\*(.+?)\*\*/gim, '<b>$1</b>')
			.replace(/\*(.+?)\*/gim, '<i>$1</i>')
			.replace(/`([^`]+)`/gim, '<code className="inline-code">$1</code>')
			.replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
			.replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>");
		
		// 5. Paragraphs
		let finalHtml = html.split('\n').map(line => {
			const trimmed = line.trim();
			if (trimmed === '') return '<br/>';
			if (trimmed.startsWith('<') || trimmed.startsWith('___CODE_BLOCK_')) return line;
			return `<p>${line}</p>`;
		}).join('');

		// 6. Restore Code Blocks
		codeBlocks.forEach((block, i) => {
			finalHtml = finalHtml.replace(`___CODE_BLOCK_${i}___`, block);
		});

		return finalHtml;
	};

	return (
		<div 
			className="markdown-body"
			dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
		/>
	);
};

const Agents = () => {
	const [agentRoster, setAgentRoster] = useState([]);
	const [selectedAgent, setSelectedAgent] = useState(null);
	const [selectedAgentData, setSelectedAgentData] = useState(null);
	const [expandedTaskIndex, setExpandedTaskIndex] = useState(null);
	const [expandedLogIndex, setExpandedLogIndex] = useState(null);
	const [selectedArtifact, setSelectedArtifact] = useState(null);
	
	useEffect(() => {
		const fetchRoster = async () => {
			try {
				const res = await fetch('/api/agents');
				const json = await res.json();
				if (json.status === 200) {
					setAgentRoster(json.data);
					if (json.data.length > 0 && !selectedAgent) {
						setSelectedAgent(json.data[0].id);
					}
				}
			} catch (err) {
				console.error('Failed to fetch agent roster:', err);
			}
		};
		fetchRoster();
	}, []);
	useEffect(() => {
		const fetchDetails = async () => {
			if (!selectedAgent) return;
			try {
				const res = await fetch(`/api/agents/${selectedAgent}`);
				const json = await res.json();
				if (json.status === 200) {
					setSelectedAgentData(json.data);
					// Note: We don't reset expandedTaskIndex on every poll, only on initial agent change
				}
			} catch (err) {
				console.error('Failed to fetch details:', err);
			}
		};

		fetchDetails();
		const interval = setInterval(fetchDetails, 5000);
		return () => clearInterval(interval);
	}, [selectedAgent]);

	// Separate effect to reset expanded states on agent change
	useEffect(() => {
		setExpandedTaskIndex(null);
		setExpandedLogIndex(null);
	}, [selectedAgent]);

	const getIcon = (role) => {
		const r = role?.toLowerCase() || '';
		if (r.includes('architect')) return 'architecture';
		if (r.includes('developer') || r.includes('node')) return 'code';
		if (r.includes('designer')) return 'brush';
		if (r.includes('analyst')) return 'analytics';
		return 'memory';
	};

	if (!selectedAgentData && agentRoster.length > 0) {
		return (
			<div className="flex-center" style={{ height: '100%', color: 'var(--outline)' }}>
				<div className="mono-data">SYNCHRONIZING WITH NEURAL NODES...</div>
			</div>
		);
	}

	if (agentRoster.length === 0) {
		return (
			<div className="flex-center" style={{ height: '100%', color: 'var(--outline)' }}>
				<div className="mono-data">NO AGENTS DETECTED IN GRID.</div>
			</div>
		);
	}

	return (
		<div className="grid-container" style={{ alignItems: 'start' }}>
			{/* Agent List Sidebar */}
			<aside className="agent-roster-sidebar">
				<h2 className="roster-header uppercase">AGENT ROSTER</h2>
				{agentRoster.map(agent => (
					<button 
						key={agent.id}
						className={`roster-btn ${selectedAgent === agent.id ? 'roster-btn-active' : ''}`}
						onClick={() => setSelectedAgent(agent.id)}
					>
						<div className="flex-center-gap-8">
							<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '20px' }}>{getIcon(agent.id)}</span>
							<div>
								<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface)' }}>{agent.id}</div>
								<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', lineHeight: 1 }}>ROLE: {agent.role}</div>
							</div>
						</div>
						<div className="status-pip" style={{ backgroundColor: agent.status === 'online' ? 'var(--primary-cyan)' : 'var(--outline)' }}></div>
					</button>
				))}
			</aside>

			{/* Drill-down View */}
			<div className="agent-drill-down">
				{/* Agent Header */}
				<header className="agent-header">
					<div>
						<h1 className="headline-lg uppercase" style={{ margin: 0, fontSize: '32px' }}>{selectedAgentData.id}</h1>
						<div className="agent-meta-container">
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>engineering</span>
								<span className="uppercase">ROLE: {selectedAgentData.role}</span>
							</div>
							<span style={{ color: 'var(--outline-variant)' }}>/</span>
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>calendar_today</span>
								<span className="uppercase">CREATED: {new Date(selectedAgentData.created).toLocaleDateString()}</span>
							</div>
							<span style={{ color: 'var(--outline-variant)' }}>/</span>
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>history</span>
								<span className="uppercase">LAST ACTIVITY: {new Date(selectedAgentData.lastActivity).toLocaleTimeString()}</span>
							</div>
							<span style={{ color: 'var(--outline-variant)' }}>/</span>
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>folder</span>
								<span className="uppercase">PROJECT: {selectedAgentData.project}</span>
							</div>
						</div>
					</div>
				</header>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gutter)' }}>
					{/* Project History */}
					<section className="bento-card">
						<h2 className="label-caps flex-center-gap-8" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
							<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span> PROJECT HISTORY
						</h2>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{selectedAgentData.history.map((h, i) => (
								<li key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < selectedAgentData.history.length - 1 ? '1px solid var(--outline-variant)' : 'none', paddingBottom: '8px' }}>
									<span className="mono-data" style={{ fontSize: '12px' }}>{h.id}</span>
									<span className="mono-data" style={{ fontSize: '10px', color: h.status === 'COMPLETED' ? 'var(--outline)' : 'var(--primary-cyan)' }}>{h.status}</span>
								</li>
							))}
							{selectedAgentData.history.length === 0 && <div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>No deployment history.</div>}
						</ul>
					</section>

					{/* Artifact Repository */}
					<section className="bento-card">
						<h2 className="label-caps flex-center-gap-8" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
							<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>folder_open</span> ARTIFACT REPOSITORY
						</h2>
						<div className="artifact-grid">
							{selectedAgentData.artifacts.map((art, i) => (
								<div 
									key={i} 
									className="artifact-link" 
									style={{ cursor: 'pointer' }}
									onClick={() => setSelectedArtifact(art)}
								>
									<span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>{art.type === 'image' ? 'image' : 'description'}</span>
									<span className="mono-data" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.name}</span>
								</div>
							))}
							{selectedAgentData.artifacts.length === 0 && <div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>No artifacts generated.</div>}
						</div>
					</section>
				</div>

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

				{/* Recent Task Stream */}
				<section className="bento-card">
					<h2 className="label-caps flex-center-gap-8" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
						<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>stream</span> RECENT TASK STREAM
					</h2>
					<div className="timeline-container">
						{selectedAgentData.tasks.map((task, i) => (
							<div 
								key={i} 
								className="timeline-item"
								style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', cursor: 'pointer' }}
								onClick={() => setExpandedTaskIndex(expandedTaskIndex === i ? null : i)}
							>
								<div className={`timeline-node ${task.active ? 'timeline-node-active' : ''}`} style={{ top: '4px' }}></div>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<span className="mono-data" style={{ fontSize: '10px', backgroundColor: 'var(--surface-variant)', padding: '0 4px', border: '1px solid var(--outline-variant)' }}>{task.id}</span>
									<span className="mono-data" style={{ fontSize: '12px', fontWeight: expandedTaskIndex === i ? '600' : '400' }}>{task.desc}</span>
								</div>
								<span className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>{new Date(task.time).toLocaleString()}</span>
								
								{expandedTaskIndex === i && (
									<div className="task-context-panel mono-data" style={{ 
										marginTop: '8px', 
										padding: '12px', 
										backgroundColor: 'var(--surface-container-low)', 
										border: '1px solid var(--outline-variant)',
										fontSize: '11px',
										color: 'var(--on-surface-variant)',
										whiteSpace: 'pre-wrap',
										wordBreak: 'break-all'
									}}>
										<div style={{ marginBottom: '8px', color: 'var(--primary-cyan)', fontWeight: 'bold' }}>TASK CONTEXT:</div>
										{JSON.stringify(task.payload, null, 2)}
										{task.metadata && (
											<>
												<div style={{ marginTop: '12px', marginBottom: '8px', color: 'var(--primary-cyan)', fontWeight: 'bold' }}>METADATA:</div>
												{JSON.stringify(task.metadata, null, 2)}
											</>
										)}
									</div>
								)}
							</div>
						))}
						{selectedAgentData.tasks.length === 0 && <div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>No tasks in stream.</div>}
					</div>
				</section>

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
						{selectedAgentData.recentLogs?.map((log, i) => (
							<div 
								key={i} 
								className="log-entry-wrapper"
								style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
								onClick={() => setExpandedLogIndex(expandedLogIndex === i ? null : i)}
							>
								<div className="flex-gap-8" style={{ backgroundColor: expandedLogIndex === i ? 'rgba(0, 174, 239, 0.1)' : 'transparent', padding: '2px 4px', borderRadius: '2px' }}>
									<span style={{ color: 'var(--outline)' }}>[{new Date(log.created).toLocaleTimeString()}]</span>
									<span style={{ color: log.level === 'error' ? 'var(--error)' : 'var(--on-surface-variant)', color: '#e6edf3' }}>{log.message}</span>
								</div>
								{expandedLogIndex === i && log.context && Object.keys(log.context).length > 0 && (
									<div style={{ 
										marginLeft: '24px', 
										padding: '8px 12px', 
										borderLeft: '2px solid var(--primary-cyan)', 
										color: '#b0deff', 
										fontSize: '11px',
										backgroundColor: 'rgba(0, 174, 239, 0.15)',
										marginTop: '4px',
										marginBottom: '4px',
										borderRadius: '0 4px 4px 0',
										boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.2)'
									}}>
										<span style={{ color: 'var(--primary-cyan)', fontWeight: 'bold', marginRight: '8px' }}>[CONTEXT]</span>
										{JSON.stringify(log.context, null, 2)}
									</div>
								)}
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
};

const App = () => {
	const [view, setView] = useState('overview');
	const [timeRange, setTimeRange] = useState('24H');
	const [data, setData] = useState({ stats: {}, throughput: [], recentLogs: [] });

	useEffect(() => {
		const fetchData = async () => {
				try {
						const res = await fetch(`/api/overview?timeRange=${timeRange}`);
						const json = await res.json();
						if (json.status === 200) {
								setData(json.data);
						}
				} catch (err) {
						console.error('Failed to fetch data:', err);
				}
		};
		fetchData();
		const interval = setInterval(fetchData, 5000);
		return () => clearInterval(interval);
	}, [timeRange]);

	return (
		<div className="app-container">
			<Sidebar currentView={view} setView={setView} />
			<Header />
			<main className="main-canvas">
				{view === 'overview' && <Overview data={data} timeRange={timeRange} setTimeRange={setTimeRange} />}
				{view === 'agents' && <Agents />}
				{view === 'projects' && (
						<div className="bento-card">
								<div className="label-caps">Project Matrix Alignment</div>
								<div className="mono-data view-placeholder-text">Loading active initiatives...</div>
						</div>
				)}
			</main>
			<footer className="app-footer">
				<div className="mono-data footer-status-text">
						SYSTEM STATUS: NOMINAL // CORE 01 ACTIVE
				</div>
			</footer>
		</div>
	);
};

export default App;
