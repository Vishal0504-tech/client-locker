
import { useState, useEffect, useRef } from 'react';
import API from './services/api';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
const [loginError, setLoginError] = useState('');
const [user, setUser] = useState(null);
const [dashboardData, setDashboardData] = useState(null);
const [dashboardError, setDashboardError] = useState('');
const [clientsData, setClientsData] = useState([]);
const [clientsError, setClientsError] = useState('');
const [documentsData, setDocumentsData] = useState([]);
const [documentsError, setDocumentsError] = useState('');

const [selectedFile, setSelectedFile] = useState(null);
const [selectedClient, setSelectedClient] = useState('');
const [uploadLoading, setUploadLoading] = useState(false);
const [uploadError, setUploadError] = useState('');
const [uploadSuccess, setUploadSuccess] = useState('');
const [checklistsData, setChecklistsData] = useState([]);
const [checklistsError, setChecklistsError] = useState('');
// AI Checklist Suggestions
const [aiSelectedClient, setAiSelectedClient] = useState('');
const [aiSuggestions, setAiSuggestions] = useState([]);
const [aiLoading, setAiLoading] = useState(false);
const [aiError, setAiError] = useState('');
const [aiSuccess, setAiSuccess] = useState('');
const [selectedSuggestions, setSelectedSuggestions] = useState([]);

 // Manual Checklist Fallback
const [manualTitle, setManualTitle] = useState('');
const [manualDescription, setManualDescription] = useState('');
const [manualCategory, setManualCategory] = useState('General');
const [staffData, setStaffData] = useState([]);
const [staffError, setStaffError] = useState('');
const [activityData, setActivityData] = useState([]);
const [activityError, setActivityError] = useState('');
const [magicLinkStatus, setMagicLinkStatus] = useState('');
const magicLinkAttempted = useRef(false);
const [magicLinkMessage, setMagicLinkMessage] = useState('');
const [magicLinkLoadingClient, setMagicLinkLoadingClient] = useState('');
const [secureDownloadLoadingId, setSecureDownloadLoadingId] = useState('');
const [secureDownloadMessage, setSecureDownloadMessage] = useState('');

const handleSecureDownload = async (doc) => {
  try {
    setSecureDownloadMessage('');
    setSecureDownloadLoadingId(doc._id);

    const token = localStorage.getItem('token');

    // Generate a one-time download link
    const response = await API.post(
      `/documents/${doc._id}/download-link`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Build the complete backend URL
    const apiRoot = API.defaults.baseURL.replace(/\/api\/?$/, '');
    const downloadUrl = `${apiRoot}${response.data.downloadPath}`;

    // Download using the one-time link
    const downloadResponse = await fetch(downloadUrl);

    if (!downloadResponse.ok) {
      let errorMessage = 'Secure download failed.';

      try {
        const errorData = await downloadResponse.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Keep the default error message
      }

      throw new Error(errorMessage);
    }

    const blob = await downloadResponse.blob();
    const fileURL = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = fileURL;
    link.download = doc.originalName || 'document';

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(fileURL);

    setSecureDownloadMessage(
      `Secure download completed: ${doc.originalName}`
    );

  } catch (error) {
    setSecureDownloadMessage(
      error.response?.data?.message ||
      error.message ||
      'Unable to download document.'
    );
  } finally {
    setSecureDownloadLoadingId('');
  }
};


const handleGenerateMagicLink = async (clientId) => {
  try {
    setMagicLinkMessage('');
    setMagicLinkLoadingClient(clientId);

    const token = localStorage.getItem('token');

    const response = await API.post(
      '/auth/magic-link',
      { clientId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setMagicLinkMessage(
      response.data.message + ' Check the configured testing inbox.'
    );
  } catch (error) {
    setMagicLinkMessage(
      error.response?.data?.message || 'Unable to generate magic link.'
    );
  } finally {
    setMagicLinkLoadingClient('');
  }
};


useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const magicToken = params.get('token');

  if (!magicToken || magicLinkAttempted.current) return;

  magicLinkAttempted.current = true;

  const verifyMagicLink = async () => {
    try {
      setMagicLinkStatus('Verifying your secure login link...');

      const response = await API.post('/auth/magic-link/verify', {
        token: magicToken,
      });

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );

      setUser(user);
      setLoggedIn(true);
      setMagicLinkStatus('Login successful!');
    } catch (error) {
      setMagicLinkStatus(
        error.response?.data?.message ||
        'Magic link verification failed. Please request a new link.'
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  };

  verifyMagicLink();
}, []);

useEffect(() => {
  if (!loggedIn || user?.role !== 'partner') return;

  const fetchActivities = async () => {
    try {
      setActivityError('');

      const token = localStorage.getItem('token');

      const response = await API.get('/activity', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setActivityData(response.data.activities);

    } catch (error) {
      setActivityError(
        error.response?.data?.message ||
        'Unable to load recent activities.'
      );
    }
  };

  fetchActivities();
}, [loggedIn, user]);

useEffect(() => {
  if (!loggedIn || user?.role !== 'partner') return;

  const fetchStaff = async () => {
    try {
      setStaffError('');

      const token = localStorage.getItem('token');

      const response = await API.get('/staff', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStaffData(response.data.staff);

    } catch (error) {
      setStaffError(
        error.response?.data?.message ||
        'Unable to load staff members.'
      );
    }
  };

  fetchStaff();
}, [loggedIn, user]);

useEffect(() => {
  if (!loggedIn) return;

  const fetchChecklists = async () => {
    try {
      setChecklistsError('');

      const token = localStorage.getItem('token');

      const response = await API.get('/checklists', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChecklistsData(response.data.checklists);

    } catch (error) {
      setChecklistsError(
        error.response?.data?.message ||
        'Unable to load checklist items.'
      );
    }
  };

  fetchChecklists();
}, [loggedIn]);


useEffect(() => {
  if (!loggedIn) return;

  const fetchDocuments = async () => {
    try {
      setDocumentsError('');

      const token = localStorage.getItem('token');

      const response = await API.get('/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDocumentsData(response.data.documents);

    } catch (error) {
      setDocumentsError(
        error.response?.data?.message ||
        'Unable to load documents.'
      );
    }
  };

  fetchDocuments();
}, [loggedIn]);

useEffect(() => {
  if (!loggedIn) return;

  const fetchDashboard = async () => {
    try {
      setDashboardError('');

      const token = localStorage.getItem('token');

      const response = await API.get('/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDashboardData(response.data.dashboard);

    } catch (error) {
      setDashboardError(
        error.response?.data?.message ||
        'Unable to load dashboard data.'
      );
    }
  };

  fetchDashboard();
}, [loggedIn]);

useEffect(() => {
  if (!loggedIn) return;

  const fetchClients = async () => {
    try {
      setClientsError('');

      const token = localStorage.getItem('token');

      const response = await API.get('/clients', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setClientsData(response.data.clients);

    } catch (error) {
      setClientsError(
        error.response?.data?.message ||
        'Unable to load clients.'
      );
    }
  };

  fetchClients();
}, [loggedIn]);


const handleLogin = async (e) => {
  e.preventDefault();

  if (!email || !password) {
    setLoginError('Please enter email and password');
    return;
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    setLoginError('Enter a valid email address');
    return;
  }

  try {
    setLoading(true);
    setLoginError('');

    const response = await API.post('/auth/login', {
      email,
      password,
    });

    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setUser(user);
    setLoggedIn(true);

  } catch (error) {
    setLoginError(
      error.response?.data?.message ||
      'Login failed. Please try again.'
    );
  } finally {
    setLoading(false);
  }
};





const handleGenerateAISuggestions = async () => {
  if (!aiSelectedClient) {
    setAiError('Please select a client.');
    return;
  }

  try {
    setAiLoading(true);
    setAiError('');
    setAiSuccess('');
    setAiSuggestions([]);
    setSelectedSuggestions([]);

    const token = localStorage.getItem('token');

    const response = await API.post(
      '/checklists/ai-suggestions',
      { clientId: aiSelectedClient },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setAiSuggestions(response.data.suggestions || []);

    if (!response.data.suggestions?.length) {
      setAiError('No new suggestions available. Please use the manual checklist.');
    }
  } catch (error) {
    setAiError(
      error.response?.data?.message ||
      'AI suggestions unavailable. Please use the manual checklist.'
    );
  } finally {
    setAiLoading(false);
  }
};

const handleApproveAISuggestions = async () => {
  const approvedSuggestions = aiSuggestions.filter(
    (_, index) => selectedSuggestions.includes(index)
  );

  if (!approvedSuggestions.length) {
    setAiError('Please select at least one suggestion.');
    return;
  }

  try {
    setAiLoading(true);
    setAiError('');

    const token = localStorage.getItem('token');

    const response = await API.post(
      '/checklists/ai-suggestions/approve',
      {
        clientId: aiSelectedClient,
        suggestions: approvedSuggestions,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setAiSuccess(response.data.message);
    setAiSuggestions([]);
    setSelectedSuggestions([]);

    const refreshed = await API.get('/checklists', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setChecklistsData(refreshed.data.checklists);
  } catch (error) {
    setAiError(
      error.response?.data?.message ||
      'Unable to save approved suggestions.'
    );
  } finally {
    setAiLoading(false);
  }
};



const handleAddManualChecklist = async (e) => {
  e.preventDefault();

  if (!aiSelectedClient || !manualTitle.trim()) {
    setAiError("Please select a client and enter a task title.");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    setAiError("Please log in again.");
    return;
  }

  try {
    setAiLoading(true);
    setAiError("");
    setAiSuccess("");

    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    await API.post(
      "/checklists/manual",
      {
        clientId: aiSelectedClient,
        title: manualTitle.trim(),
        description: manualDescription.trim(),
        category: manualCategory,
      },
      config
    );

    setManualTitle("");
    setManualDescription("");
    setManualCategory("General");

    const response = await API.get("/checklists", config);
    setChecklistsData(response.data.checklists);

    setAiSuccess("Manual checklist task created successfully!");

  } catch (error) {
    setAiError(
      error.response?.data?.message ||
      "Unable to create manual checklist task."
    );
  } finally {
    setAiLoading(false);
  }
};





const handleDocumentUpload = async (e) => {
  e.preventDefault();

  if (!selectedFile) {
    setUploadError('Please select a document.');
    return;
  }

  const clientId =
    user?.role === 'client'
      ? clientsData[0]?._id
      : selectedClient;

  if (!clientId) {
    setUploadError('Please select a client.');
    return;
  }

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ];

  if (!allowedTypes.includes(selectedFile.type)) {
    setUploadError('Only PDF, JPG and PNG files are allowed.');
    return;
  }

  if (selectedFile.size > 4 * 1024 * 1024) {
    setUploadError('File size must not exceed 4 MB.');
    return;
  }

  try {
    setUploadLoading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('document', selectedFile);
    formData.append('clientId', clientId);

    const token = localStorage.getItem('token');

    await API.post('/documents', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setUploadSuccess('Document uploaded successfully!');
    setSelectedFile(null);
    setSelectedClient('');

    // Refresh document list
    const response = await API.get('/documents', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setDocumentsData(response.data.documents);

  } catch (error) {
    setUploadError(
      error.response?.data?.message ||
      'Document upload failed.'
    );
  } finally {
    setUploadLoading(false);
  }
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

          {magicLinkStatus && (
  <p
    style={{
      color: magicLinkStatus.includes('successful') ? 'green' : '#2563eb',
      fontSize: '14px',
      marginBottom: '15px',
    }}
  >
    {magicLinkStatus}
  </p>
)}

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

            {loginError && (
  <p style={{ color: 'red', fontSize: '14px' }}>
    {loginError}
  </p>
)}

            <button type="submit" disabled={loading}>
  {loading ? 'Signing In...' : 'Sign In'}
</button>
          </form>

          <p className="footer">
            © 2026 ClientLocker. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  const menuItems = ['Dashboard', 'Documents', 'Clients', 'Staff', 'Checklist'];

  const renderContent = () => {
    if (activePage === 'Dashboard') {
      return (
        <>
          <div className="welcome-section">
            <h2>Dashboard Overview</h2>
            <p>Welcome back! Here's what's happening in your portal.</p>
          </div>


{dashboardError && (
  <p style={{ color: 'red' }}>{dashboardError}</p>
)}

{!dashboardData ? (
  <p>Loading dashboard...</p>
) : (
  <div className="stats-grid">
    <div className="stat-card">
      <span>Total Documents</span>
      <h2>{dashboardData.totalDocuments ?? 0}</h2>
      <p>Documents stored</p>
    </div>

    {user?.role !== 'client' && (
      <div className="stat-card">
        <span>Total Clients</span>
        <h2>{dashboardData.totalClients ?? 0}</h2>
        <p>
          {user?.role === 'staff'
            ? 'Assigned clients'
            : 'Registered clients'}
        </p>
      </div>
    )}

    {user?.role === 'partner' && (
      <div className="stat-card">
        <span>Total Staff</span>
        <h2>{dashboardData.totalStaff ?? 0}</h2>
        <p>Active team members</p>
      </div>
    )}

    <div className="stat-card">
      <span>Pending Tasks</span>
      <h2>{dashboardData.pendingTasks ?? 0}</h2>
      <p>Tasks awaiting completion</p>
    </div>

    {user?.role !== 'partner' && (
      <div className="stat-card">
        <span>Total Tasks</span>
        <h2>{dashboardData.totalTasks ?? 0}</h2>
        <p>Assigned tasks</p>
      </div>
    )}
  </div>
)}


          <ActivityTable
  activities={activityData}
  activityError={activityError}
  user={user}
/>
        </>
      );
    }



if (activePage === 'Documents') {
  return (
    <>
      <div className="welcome-section">
        <h2>Documents</h2>
        <p>View and access your stored documents.</p>
      </div>

      {documentsError && (
        <p style={{ color: 'red' }}>{documentsError}</p>
      )}

      {secureDownloadMessage && (
        <p
          style={{
            color: secureDownloadMessage.includes('completed')
              ? 'green'
              : 'red',
            marginBottom: '12px',
          }}
        >
          {secureDownloadMessage}
        </p>
      )}

      <div
        className="table-card"
        style={{ marginBottom: '20px', padding: '20px' }}
      >
        <h3>Upload New Document</h3>

        <form onSubmit={handleDocumentUpload}>
          {user?.role !== 'client' && (
            <div style={{ marginBottom: '15px' }}>
              <label>Select Client</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                required
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '10px',
                  marginTop: '8px',
                }}
              >
                <option value="">Choose a client</option>

                {clientsData.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label>Select Document (PDF, JPG, PNG)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                setSelectedFile(e.target.files[0] || null);
                setUploadError('');
                setUploadSuccess('');
              }}
              required
              style={{ display: 'block', marginTop: '8px' }}
            />
            <small>Maximum file size: 4 MB</small>
          </div>

          {uploadError && (
            <p style={{ color: 'red' }}>{uploadError}</p>
          )}

          {uploadSuccess && (
            <p style={{ color: 'green' }}>{uploadSuccess}</p>
          )}

          <button type="submit" disabled={uploadLoading}>
            {uploadLoading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      <div className="table-card">
        <h3>Document List ({documentsData.length})</h3>

        <table>
          <thead>
            <tr>
              <th>Document Name</th>
              <th>File Type</th>
              <th>Client</th>
              <th>Uploaded By</th>
              <th>Upload Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {documentsData.length > 0 ? (
              documentsData.map((doc) => (
                <tr key={doc._id}>
                  <td>{doc.originalName}</td>
                  <td>{doc.mimeType}</td>
                  <td>{doc.client?.name || '-'}</td>
                  <td>{doc.uploadedBy?.name || '-'}</td>
                  <td>
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>

                  <td>
                    {/* Existing Open button */}
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');

                          const response = await API.get(
                            `/documents/${doc._id}/open`,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                              responseType: 'blob',
                            }
                          );

                          const fileURL = window.URL.createObjectURL(
                            response.data
                          );

                          window.open(fileURL, '_blank');

                        } catch (error) {
                          alert(
                            error.response?.data?.message ||
                            'Unable to open document.'
                          );
                        }
                      }}
                    >
                      Open
                    </button>

                    {/* New Secure Download button */}
                    <button
                      onClick={() => handleSecureDownload(doc)}
                      disabled={secureDownloadLoadingId === doc._id}
                      style={{ marginLeft: '8px' }}
                    >
                      {secureDownloadLoadingId === doc._id
                        ? 'Downloading...'
                        : 'Secure Download'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No documents found.</td>
              </tr>
            )}
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

      {clientsError && (
        <p style={{ color: 'red' }}>{clientsError}</p>
      )}

      <div className="table-card">
        <h3>Client List ({clientsData.length})</h3>

        <table>
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Assigned Staff</th>
<th>Status</th>
{user.role === 'partner' && <th>Magic Link</th>}
            </tr>
          </thead>

          <tbody>
            {clientsData.length > 0 ? (
              clientsData.map((client) => (
                <tr key={client._id}>
                  <td>{client.name}</td>
                  <td>{client.email}</td>
                  <td>{client.company || '-'}</td>
                  <td>
                    {client.assignedStaff?.name || 'Not assigned'}
                  </td>
                  <td>
                    <span className="status">
                      {client.status}
                    </span>
                  </td>
                  {user.role === 'partner' && (
                    <td>
                      <button
                        onClick={() => handleGenerateMagicLink(client._id)}
                        disabled={magicLinkLoadingClient === client._id}
                      >
                        {magicLinkLoadingClient === client._id
                          ? 'Generating...'
                          : 'Generate Magic Link'}
                      </button>
                      {magicLinkMessage && (
                        <p style={{ color: 'green' }}>
                          {magicLinkMessage}
                        </p>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  No clients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}



if (activePage === 'Checklist') {
  const completedTasks = checklistsData.filter(
    (task) => task.isCompleted
  ).length;

  const pendingTasks = checklistsData.length - completedTasks;

  return (
    <>
      <div className="welcome-section">
        <h2>Checklist Management</h2>
        <p>Track and manage your assigned tasks.</p>
      </div>

      {checklistsError && (
        <p style={{ color: 'red' }}>{checklistsError}</p>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <h2>{checklistsData.length}</h2>
        </div>

        <div className="stat-card">
          <h3>Completed</h3>
          <h2>{completedTasks}</h2>
        </div>

        <div className="stat-card">
          <h3>Pending</h3>
          <h2>{pendingTasks}</h2>
        </div>
      </div>




{(user?.role === 'partner' || user?.role === 'staff') && (
  <div
    className="table-card"
    style={{ marginBottom: '20px', padding: '24px' }}
  >
    <h3>AI Checklist Assistant</h3>
    <p style={{ marginBottom: '20px', color: '#64748b' }}>
      Generate document collection tasks using AI. Review and approve before saving.
    </p>

    {/* AI Client Selection */}
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '15px',
        flexWrap: 'wrap',
        marginBottom: '20px',
      }}
    >
      <div style={{ flex: '1', minWidth: '220px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Select Client
        </label>

        <select
          value={aiSelectedClient}
          onChange={(e) => setAiSelectedClient(e.target.value)}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            boxSizing: 'border-box',
          }}
        >
          <option value="">Choose a client</option>
          {clientsData.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleGenerateAISuggestions}
        disabled={aiLoading || !aiSelectedClient}
        style={{ minHeight: '42px' }}
      >
        {aiLoading ? 'Generating...' : 'Generate AI Suggestions'}
      </button>
    </div>

    {aiError && (
      <p style={{ color: 'red', marginBottom: '12px' }}>
        {aiError}
      </p>
    )}

    {aiSuccess && (
      <p style={{ color: 'green', marginBottom: '12px' }}>
        {aiSuccess}
      </p>
    )}

    {/* AI Suggestions */}
    {aiSuggestions.length > 0 && (
      <div style={{ marginBottom: '20px' }}>
        <h4>Review AI Suggestions</h4>

        {aiSuggestions.map((suggestion, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #e2e8f0',
              padding: '14px',
              marginBottom: '10px',
              borderRadius: '8px',
            }}
          >
            <label style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={selectedSuggestions.includes(index)}
                onChange={(e) => {
                  setSelectedSuggestions((previous) =>
                    e.target.checked
                      ? [...previous, index]
                      : previous.filter((item) => item !== index)
                  );
                }}
              />
              <strong>{suggestion.title}</strong>
            </label>

            <p>{suggestion.description}</p>
            <small>Category: {suggestion.category}</small>
          </div>
        ))}

        <button
          onClick={handleApproveAISuggestions}
          disabled={aiLoading || selectedSuggestions.length === 0}
        >
          Approve Selected Tasks
        </button>
      </div>
    )}

    <hr style={{ margin: '24px 0', border: '0', borderTop: '1px solid #e2e8f0' }} />

    {/* Manual Checklist */}
    <h4>Manual Checklist Entry</h4>
    <p style={{ color: '#64748b', marginBottom: '18px' }}>
      If AI is unavailable, enter a checklist task manually.
    </p>

    <form
      onSubmit={handleAddManualChecklist}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        alignItems: 'end',
      }}
    >
      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Task Title
        </label>
        <input
          type="text"
          placeholder="Enter task title"
          value={manualTitle}
          onChange={(e) => setManualTitle(e.target.value)}
          required
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Description
        </label>
        <input
          type="text"
          placeholder="Enter description"
          value={manualDescription}
          onChange={(e) => setManualDescription(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '11px' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Category
        </label>
        <select
          value={manualCategory}
          onChange={(e) => setManualCategory(e.target.value)}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '11px',
          }}
        >
          <option value="General">General</option>
          <option value="Financial">Financial</option>
          <option value="Tax">Tax</option>
          <option value="Administrative">Administrative</option>
        </select>
      </div>

      <div>
        <button type="submit" disabled={aiLoading} style={{ width: '100%', minHeight: '42px' }}>
          {aiLoading ? 'Saving...' : 'Add Manual Task'}
        </button>
      </div>
    </form>
  </div>
)}



      <div className="table-card">
        <h3>Checklist Items</h3>

        <table>
          <thead>
            <tr>
              <th>Task</th>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {checklistsData.length > 0 ? (
              checklistsData.map((task) => (
                <tr key={task._id}>
                  <td>{task.title}</td>
                  <td>{task.category}</td>
                  <td>{task.description || '-'}</td>
                  <td>
                    <span className="status">
                      {task.isCompleted ? 'Completed' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button
                      disabled={task.isCompleted}
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');

                          await API.patch(
                            `/checklists/${task._id}`,
                            { isCompleted: true },
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                              },
                            }
                          );

                          setChecklistsData((previous) =>
                            previous.map((item) =>
                              item._id === task._id
                                ? { ...item, isCompleted: true }
                                : item
                            )
                          );

                        } catch (error) {
                          alert(
                            error.response?.data?.message ||
                            'Unable to update task.'
                          );
                        }
                      }}
                    >
                      {task.isCompleted ? 'Completed' : 'Mark Complete'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No checklist items found.</td>
              </tr>
            )}
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
        <h2>Staff Management</h2>
        <p>View staff members registered in your firm.</p>
      </div>

      {user?.role !== 'partner' ? (
        <p>You are not authorized to view staff management.</p>
      ) : (
        <>
          {staffError && (
            <p style={{ color: 'red' }}>{staffError}</p>
          )}

          <div className="table-card">
            <h3>Staff Members ({staffData.length})</h3>

            <table>
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Email</th>
                  <th>Designation</th>
                  <th>Account Status</th>
                </tr>
              </thead>

              <tbody>
                {staffData.length > 0 ? (
                  staffData.map((staff) => (
                    <tr key={staff._id}>
                      <td>{staff.name}</td>
                      <td>{staff.email}</td>
                      <td>{staff.designation || '-'}</td>
                      <td>
                        <span className="status">
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      No staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
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
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  setLoggedIn(false);
  setEmail('');
  setPassword('');
  setUser(null);
  setLoginError('');
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
             <strong>{user?.name || 'User'}</strong>
<small>{user?.role || 'Account'}</small>
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




function ActivityTable({ activities = [], activityError = '', user }) {
  return (
    <div className="table-card">
      <h3>Recent Activities</h3>

      {user?.role === 'partner' ? (
        <>
          {activityError && (
            <p style={{ color: 'red' }}>{activityError}</p>
          )}

          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Actions</th>
                <th>Document</th>
                <th>Client</th>
                <th>Date & Time</th>
              </tr>
            </thead>

            <tbody>
              {activities.length > 0 ? (
                activities.slice(0, 10).map((activity) => (
                  <tr key={activity._id}>
                    <td>{activity.user?.name || '-'}</td>
                    <td>{activity.action}</td>
                    <td>{activity.document?.originalName || '-'}</td>
                    <td>{activity.client?.name || '-'}</td>
                    <td>
                      {new Date(activity.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No recent activities found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      ) : (
        <p>Recent activity details are available to Partners only.</p>
      )}
    </div>
  );
}


export default App;
