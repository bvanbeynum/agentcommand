import React, { useState, useEffect } from 'react';
import Overview from './Overview.js';
import Agents from './Agents.js';
import Projects from './Projects.js';

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
				{view === 'projects' && <Projects />}
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
