
import { useState } from 'react';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');

  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      alert('Enter a valid email address');
      return;
    }

    setLoggedIn(true);
  };

  const activities = [
    { name: 'Annual Tax Report.pdf', user: 'Admin', action: 'Uploaded', date: 'Nov 06, 2026' },
    { name: 'Client Financial Statement.pdf', user: 'Staff', action: 'Updated', date: 'Nov 05, 2026' },
    { name: 'Audit Report.pdf', user: 'Auditor', action: 'Viewed', date: 'Nov 04, 2026' },
  ];

  const documents = [
    { name: 'Annual Tax Report.pdf', type: 'Tax Document', date: 'Nov 06, 2026', status: 'Approved' },
    { name: 'Financial Statement.pdf', type: 'Financial', date: 'Nov 05, 2026', status: 'Pending' },
    { name: 'Audit Report.pdf', type: 'Audit', date: 'Nov 04, 2026', status: 'Approved' },
  ];

  const clients = [
    { name: 'ABC Technologies', email: 'abc@example.com', status: 'Active' },
    { name: 'XYZ Enterprises', email: 'xyz@example.com', status: 'Active' },
    { name: 'Global Solutions', email: 'global@example.com', status: 'Pending' },
  ];

  const staff = [
    { name: 'Arun Kumar', role: 'Accountant', email: 'arun@example.com' },
    { name: 'Priya S', role: 'Document Manager', email: 'priya@example.com' },
    { name: 'Rahul M', role: 'Auditor', email: 'rahul@example.com' },
  ];

  if (!loggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>ClientLocker</h1>
          <p className="subtitle">Secure Document Management Portal</p>
          <h2>Welcome Back</h2>
          <p className="description">Sign in to access your account</p>

          <form onSubmit={handleLogin}>
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Sign In</button>
          </form>

          <p className="footer">
            © 2026 ClientLocker. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  const menuItems = ['Dashboard', 'Documents', 'Clients', 'Staff'];

  const renderContent = () => {
    if (activePage === 'Dashboard') {
      return (
        <>
          <div className="welcome-section">
            <h2>Dashboard Overview</h2>
            <p>Welcome back! Here's what's happening in your portal.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Documents</span>
              <h2>248</h2>
              <p>Documents stored</p>
            </div>
            <div className="stat-card">
              <span>Total Clients</span>
              <h2>36</h2>
              <p>Registered clients</p>
            </div>
            <div className="stat-card">
              <span>Total Staff</span>
              <h2>12</h2>
              <p>Active team members</p>
            </div>
            <div className="stat-card">
              <span>Pending Reviews</span>
              <h2>08</h2>
              <p>Awaiting approval</p>
            </div>
          </div>

          <ActivityTable activities={activities} />
        </>
      );
    }

    if (activePage === 'Documents') {
      return (
        <>
          <div className="welcome-section">
            <h2>Documents</h2>
            <p>Manage and view your stored documents.</p>
          </div>
          <div className="table-card">
            <h3>All Documents</h3>
            <table>
              <thead>
                <tr><th>Document</th><th>Category</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr key={i}>
                    <td>{doc.name}</td>
                    <td>{doc.type}</td>
                    <td>{doc.date}</td>
                    <td><span className="status">{doc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (activePage === 'Clients') {
      return (
        <>
          <div className="welcome-section">
            <h2>Clients</h2>
            <p>View and manage registered clients.</p>
          </div>
          <div className="table-card">
            <h3>Client List</h3>
            <table>
              <thead>
                <tr><th>Client Name</th><th>Email</th><th>Status</th></tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr key={i}>
                    <td>{client.name}</td>
                    <td>{client.email}</td>
                    <td><span className="status">{client.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }

    if (activePage === 'Staff') {
      return (
        <>
          <div className="welcome-section">
            <h2>Staff</h2>
            <p>View your team members and their roles.</p>
          </div>
          <div className="table-card">
            <h3>Staff Members</h3>
            <table>
              <thead>
                <tr><th>Name</th><th>Role</th><th>Email</th></tr>
              </thead>
              <tbody>
                {staff.map((member, i) => (
                  <tr key={i}>
                    <td>{member.name}</td>
                    <td>{member.role}</td>
                    <td>{member.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      );
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="brand">ClientLocker</h2>
        <p className="menu-label">MAIN MENU</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={activePage === item ? 'nav-item active' : 'nav-item'}
              onClick={() => setActivePage(item)}
            >
              {item === 'Dashboard' && '▦'}
              {item === 'Documents' && '▤'}
              {item === 'Clients' && '♙'}
              {item === 'Staff' && '♧'}
              <span>{item}</span>
            </button>
          ))}
        </nav>

        <button
          className="logout-button"
          onClick={() => {
            setLoggedIn(false);
            setEmail('');
            setPassword('');
            setActivePage('Dashboard');
          }}
        >
          ↪ <span>Logout</span>
        </button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h3>{activePage}</h3>
            <p>ClientLocker Management Portal</p>
          </div>
          <div className="profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin User</strong>
              <small>Administrator</small>
            </div>
          </div>
        </header>

        <section className="page-content">
          {renderContent()}
        </section>
      </main>
    </div>
  );
}

function ActivityTable({ activities }) {
  return (
    <div className="table-card">
      <h3>Recent Activities</h3>
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>User</th>
            <th>Activity</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity, i) => (
            <tr key={i}>
              <td>{activity.name}</td>
              <td>{activity.user}</td>
              <td>{activity.action}</td>
              <td>{activity.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
