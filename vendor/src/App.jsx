import React, { useState, useEffect, useRef } from 'react';
import { LogIn, Plus, Trash2, Edit2, LogOut, CheckCircle, XCircle, Upload, X, Save, AlertCircle, RefreshCw, FileText, MessageSquare, Contact } from 'lucide-react';

// API Endpoint URL
const API_BASE = import.meta.env.VITE_API_URL || '';

const translateCategory = (type, lang) => {
  if (lang === 'ta') {
    if (type === 'Cow') return 'பசு மாடு';
    if (type === 'Goat') return 'ஆடு';
    if (type === 'Cow Calf') return 'கன்றுக்குட்டி';
    if (type === 'Goat Kid') return 'ஆட்டுக்குட்டி';
  }
  return type;
};

const translateGender = (gender, lang) => {
  if (lang === 'ta') {
    if (gender === 'Female') return 'பெண்';
    if (gender === 'Male') return 'ஆண்';
  }
  return gender;
};

const translateStatus = (status, lang) => {
  if (lang === 'ta') {
    if (status.toLowerCase() === 'available') return 'விற்பனைக்கு உள்ளது';
    if (status.toLowerCase() === 'sold') return 'விற்பனையானது';
  }
  return status;
};

function App() {
  const [language, setLanguage] = useState(localStorage.getItem('sekar_vendor_lang') || 'en');
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('sekar_token') || '');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Listings state
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message: string }
  const [showWakeupMessage, setShowWakeupMessage] = useState(false);

  useEffect(() => {
    let timer;
    if (authLoading || loadingListings) {
      timer = setTimeout(() => {
        setShowWakeupMessage(true);
      }, 3500);
    } else {
      setShowWakeupMessage(false);
    }
    return () => clearTimeout(timer);
  }, [authLoading, loadingListings]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null); // null means adding a new listing
  
  // Form fields
  const [animalName, setAnimalName] = useState('');
  const [animalType, setAnimalType] = useState('Cow');
  const [gender, setGender] = useState('Female');
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [age, setAge] = useState('');
  const [teethCount, setTeethCount] = useState('');
  const [milkCapacity, setMilkCapacity] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState('Available');
  const [calfKidStatus, setCalfKidStatus] = useState('');
  const [customCalfKidStatus, setCustomCalfKidStatus] = useState('');
  const [media, setMedia] = useState([]); // Array of { type: 'image'|'video', url: string, public_id: string }

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Voice Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioFileInputRef = useRef(null);
  
  // Vendor settings fields
  const [phoneSetting, setPhoneSetting] = useState('');
  const [whatsappSetting, setWhatsappSetting] = useState('');
  const [mapsUrlSetting, setMapsUrlSetting] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  const fileInputRef = useRef(null);

  // Auto-dismiss alert
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // Check auth validity on startup
  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  // Fetch listings and settings on login
  useEffect(() => {
    if (token) {
      fetchListings();
      fetchSettings();
    }
  }, [token]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/vendor-info`);
      if (response.ok) {
        const data = await response.json();
        setPhoneSetting(data.phone || '');
        setWhatsappSetting(data.whatsappLink || '');
        setMapsUrlSetting(data.mapsUrl || '');
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingSettings(true);
    
    // Auto-generate whatsapp link from phone setting
    const cleanNumber = phoneSetting.replace(/[^0-9]/g, '');
    const autoLink = cleanNumber ? `https://wa.me/${cleanNumber}` : '';

    try {
      const response = await fetch(`${API_BASE}/api/vendor-info`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: phoneSetting,
          whatsappLink: autoLink,
          mapsUrl: mapsUrlSetting
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update contact info');
      }
      setAlert({ type: 'success', message: 'Vendor contact settings updated!' });
      setIsEditingSettings(false);
      fetchSettings();
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: err.message || 'Failed to update settings.' });
    } finally {
      setSavingSettings(false);
    }
  };

  const verifyToken = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token invalid, logout
        handleLogout();
      }
    } catch (err) {
      console.error('Verify token failed:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }
      
      localStorage.setItem('sekar_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setUsername('');
      setPassword('');
      setAlert({ type: 'success', message: 'Logged in successfully!' });
    } catch (err) {
      console.error(err);
      setAuthError(err.message || 'Server connection failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sekar_token');
    setToken('');
    setUser(null);
    setListings([]);
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const response = await fetch(`${API_BASE}/api/listings`);
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setAlert({ type: 'error', message: 'Failed to fetch listings from database.' });
    } finally {
      setLoadingListings(false);
    }
  };

  // Toggle listing status quickly (Available <-> Sold)
  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'Available' ? 'Sold' : 'Available';
    try {
      const response = await fetch(`${API_BASE}/api/listings/${item._id || item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setListings(prev => 
          prev.map(l => (l._id === item._id || l.id === item.id) ? { ...l, status: newStatus } : l)
        );
        setAlert({ type: 'success', message: `Status updated to ${newStatus}!` });
      } else {
        throw new Error('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Failed to toggle status.' });
    }
  };

  // Delete listing
  const handleDeleteListing = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/listings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setListings(prev => prev.filter(l => l._id !== id && l.id !== id));
        setAlert({ type: 'success', message: 'Listing deleted successfully!' });
      } else {
        throw new Error('Failed to delete listing');
      }
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Failed to delete listing.' });
    }
  };

  // Modal Open
  const openModal = (listing = null) => {
    setEditingListing(listing);
    setUploadError('');
    setUploadProgress(0);
    
    if (listing) {
      setAnimalName(listing.animalName || '');
      setAnimalType(listing.animalType || 'Cow');
      setGender(listing.gender || 'Female');
      setBreed(listing.breed);
      setDescription(listing.description || '');
      setVoiceDescription(listing.voiceDescription || '');
      setAge(listing.age !== undefined ? listing.age.toString() : '');
      setTeethCount(listing.teethCount !== undefined ? listing.teethCount.toString() : '');
      setMilkCapacity(listing.milkCapacity !== null && listing.milkCapacity !== undefined ? listing.milkCapacity.toString() : '');
      setPrice(listing.price !== undefined ? listing.price.toString() : '');
      setStatus(listing.status);
      
      const standardCowOptions = ["No Calf", "Male Calf", "Female Calf", "One Male, One Female"];
      const standardGoatOptions = ["No Kid", "Male Kid", "Female Kid", "One Male, One Female"];
      const isCowType = listing.animalType === 'Cow' || listing.animalType === 'Cow Calf';
      const standardOptions = isCowType ? standardCowOptions : standardGoatOptions;
      
      const currentStatus = listing.calfKidStatus || '';
      if (currentStatus === '' || standardOptions.includes(currentStatus)) {
        setCalfKidStatus(currentStatus);
        setCustomCalfKidStatus('');
      } else {
        setCalfKidStatus('Custom...');
        setCustomCalfKidStatus(currentStatus);
      }
      
      setMedia(listing.media || []);
    } else {
      setAnimalName('');
      setAnimalType('Cow');
      setGender('Female');
      setBreed('');
      setDescription('');
      setVoiceDescription('');
      setAge('');
      setTeethCount('');
      setMilkCapacity('');
      setPrice('');
      setStatus('Available');
      setCalfKidStatus('');
      setCustomCalfKidStatus('');
      setMedia([]);
    }
    setIsModalOpen(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/mp3' });
        uploadAudioFile(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setUploadError('');
    } catch (err) {
      console.error('Mic access error:', err);
      setUploadError('Microphone access denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudioFile = async (fileOrBlob) => {
    try {
      setUploading(true);
      setUploadProgress(15);
      const formData = new FormData();
      const filename = fileOrBlob.name || `voice-note-${Date.now()}.mp3`;
      formData.append('media', fileOrBlob, filename);

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(75);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');

      setUploadProgress(100);
      setVoiceDescription(data.url);
      setUploading(false);
    } catch (err) {
      console.error(err);
      setUploadError(`Audio upload failed: ${err.message}`);
      setUploading(false);
    }
  };

  // Handle Form Submit
  const handleSaveListing = async (e) => {
    e.preventDefault();
    if (!animalName || !animalType || !gender || !breed || (!description && !voiceDescription) || age === '' || !teethCount || !price) {
      setAlert({ type: 'error', message: 'Please fill in all mandatory fields (Description or Voice Message must be provided).' });
      return;
    }

    let finalCalfKidStatus = calfKidStatus;
    if (calfKidStatus === 'Custom...') {
      finalCalfKidStatus = customCalfKidStatus;
    }

    const isAdultFemale = (animalType === 'Cow' || animalType === 'Goat') && gender === 'Female';
    const finalMilk = isAdultFemale && milkCapacity !== '' ? String(milkCapacity) : '';
    const finalCalfStatus = isAdultFemale ? finalCalfKidStatus : '';

    const payload = {
      animalName,
      animalType,
      gender,
      breed,
      description,
      voiceDescription,
      age: String(age),
      teethCount: String(teethCount),
      milkCapacity: finalMilk,
      price: Number(price),
      status,
      calfKidStatus: finalCalfStatus,
      media
    };

    try {
      let response;
      if (editingListing) {
        const id = editingListing._id || editingListing.id;
        response = await fetch(`${API_BASE}/api/listings/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API_BASE}/api/listings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save listing.');
      }

      setAlert({ 
        type: 'success', 
        message: editingListing ? 'Listing updated successfully!' : 'New listing added successfully!' 
      });
      setIsModalOpen(false);
      fetchListings();
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: err.message || 'Failed to save listing.' });
    }
  };

  // Upload handling
  const handleUploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    setUploadProgress(10); // Initial progress

    const formData = new FormData();
    formData.append('media', file);

    try {
      // We will perform an XMLHTTPRequest to track progress accurately
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/api/upload`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          // Scale it to 90%, leaving the last 10% for backend processing
          setUploadProgress(Math.min(90, percentComplete));
        }
      };

      xhr.onload = () => {
        setUploadProgress(100);
        if (xhr.status >= 200 && xhr.status < 300) {
          const responseData = JSON.parse(xhr.responseText);
          setMedia(prev => [...prev, responseData]);
          setUploading(false);
          setAlert({ type: 'success', message: 'Media uploaded successfully!' });
        } else {
          const errRes = JSON.parse(xhr.responseText || '{}');
          setUploadError(errRes.message || 'File upload failed on server.');
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        setUploadError('Network connection failed during upload.');
        setUploading(false);
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setUploadError(err.message || 'File upload failed.');
      setUploading(false);
    }
  };

  const removeMediaItem = (idx) => {
    setMedia(prev => prev.filter((_, i) => i !== idx));
  };

  // Helper: Format price
  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // If user is not authenticated, show Login form
  if (!token || !user) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button 
            onClick={() => {
              const nextLang = language === 'en' ? 'ta' : 'en';
              setLanguage(nextLang);
              localStorage.setItem('sekar_vendor_lang', nextLang);
            }}
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontFamily: 'inherit'
            }}
            type="button"
          >
            🌐 {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
        </div>
        <div className="login-header">
          <div className="login-logo">🐄</div>
          <h2>{language === 'en' ? 'Sekar Dairy Farm' : 'சேகர் டெய்ரி ஃபார்ம்'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {language === 'en' ? 'Vendor Management Portal' : 'விற்பனையாளர் நிர்வாக தளம்'}
          </p>
        </div>
        
        {authError && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">{language === 'en' ? 'Username' : 'பயனர் பெயர்'}</label>
            <input 
              type="text" 
              className="form-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={language === 'en' ? "Enter vendor username" : "பயனர் பெயரை உள்ளிடவும்"}
              required
              disabled={authLoading}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">{language === 'en' ? 'Password' : 'கடவுச்சொல்'}</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={language === 'en' ? "Enter password" : "கடவுச்சொல்லை உள்ளிடவும்"}
              required
              disabled={authLoading}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={authLoading}>
            {authLoading ? (
              <>
                <RefreshCw className="animate-spin" size={18} /> {language === 'en' ? 'Signing In...' : 'உள்நுழைகிறது...'}
              </>
            ) : (
              <>
                <LogIn size={18} /> {language === 'en' ? 'Access Dashboard' : 'நிர்வாக பலகைக்குச் செல்'}
              </>
            )}
          </button>
        </form>
        
        {showWakeupMessage && (
          <p style={{ marginTop: '1rem', color: '#ff6b6b', fontSize: '0.8rem', textAlign: 'center', lineHeight: '1.4' }}>
            ⚠️ {language === 'en' 
              ? 'Render Database Server is waking up from sleep. This may take up to 45 seconds on the first visit...' 
              : 'குறிப்பு: தரவுத்தள சேவையகம் தூக்கத்திலிருந்து துவங்குகிறது. முதல் முறை தொடங்க 45 வினாடிகள் வரை ஆகலாம்...'}
          </p>
        )}
        
        <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          {language === 'en' ? 'Authorized Sekar Dairy Farm staff only.' : 'சேகர் பண்ணை அங்கீகரிக்கப்பட்ட பணியாளர்கள் மட்டுமே.'}
        </p>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div>
      {/* Navbar */}
      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">🛡️</span>
          <span>{language === 'en' ? 'Sekar Farm Admin' : 'சேகர் பண்ணை நிர்வாகி'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => {
              const nextLang = language === 'en' ? 'ta' : 'en';
              setLanguage(nextLang);
              localStorage.setItem('sekar_vendor_lang', nextLang);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'white',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s',
              fontFamily: 'inherit'
            }}
            type="button"
          >
            🌐 {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
          <span className="user-badge">
            👤 {user.username} ({user.role})
          </span>
          <button onClick={handleLogout} className="btn-logout" title={language === 'en' ? 'Sign Out' : 'வெளியேறு'}>
            <LogOut size={16} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> {language === 'en' ? 'Sign Out' : 'வெளியேறு'}
          </button>
        </div>
      </header>

      <main className="container">
        {/* Global Notification Alerts */}
        {alert && (
          <div className={`alert alert-${alert.type}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Dashboard Header */}
        <section className="dashboard-header">
          <div>
            <h1>{language === 'en' ? 'Livestock Listings Manager' : 'கால்நடை பட்டியல்கள் மேலாளர்'}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              {language === 'en' ? 'Add and update cows and goats listing details on the customer website.' : 'விற்பனைக்கான மாடுகள் மற்றும் ஆடுகளின் விவரங்களை வாடிக்கையாளர் பக்கத்தில் சேர்க்கவும் மற்றும் புதுப்பிக்கவும்.'}
            </p>
          </div>
          <button onClick={() => openModal()} className="btn-primary" style={{ borderRadius: '8px' }}>
            <Plus size={18} /> {language === 'en' ? 'Add New Listing' : 'புதிய கால்நடை சேர்'}
          </button>
        </section>

        {/* Vendor Contact Info (Mockup Style, Full-width) */}
        <section style={{ background: 'var(--card-bg)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '2rem', marginBottom: '2rem', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary-color)' }}>
              <span className="logo-icon">🪪</span> {language === 'en' ? 'Vendor Contact Info' : 'விற்பனையாளர் தொடர்பு விவரங்கள்'}
            </h3>
            <button 
              type="button" 
              onClick={isEditingSettings ? () => handleSaveSettings() : () => setIsEditingSettings(true)} 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.9rem', border: '1px solid var(--primary-color)', color: 'var(--primary-color)', fontWeight: '600' }}
              disabled={savingSettings}
            >
              {savingSettings ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : isEditingSettings ? (
                <Save size={14} />
              ) : (
                <Edit2 size={14} />
              )}
              {savingSettings ? (language === 'en' ? 'Saving...' : 'சேமிக்கிறது...') : isEditingSettings ? (language === 'en' ? 'Save Info' : 'விவரங்களைச் சேமி') : (language === 'en' ? 'Edit Info' : 'விவரங்களை திருத்து')}
            </button>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800', letterSpacing: '0.5px' }}>{language === 'en' ? 'PHONE NUMBER' : 'தொலைபேசி எண்'}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={phoneSetting} 
                  onChange={(e) => setPhoneSetting(e.target.value)} 
                  placeholder="e.g. +919876543210"
                  disabled={!isEditingSettings}
                  style={{ background: !isEditingSettings ? 'rgba(0,0,0,0.01)' : 'white' }}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: '800', letterSpacing: '0.5px' }}>{language === 'en' ? 'GOOGLE MAPS LINK' : 'கூகுள் மேப் முகவரி'}</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={mapsUrlSetting} 
                  onChange={(e) => setMapsUrlSetting(e.target.value)} 
                  placeholder="e.g. https://maps.app.goo.gl/..."
                  disabled={!isEditingSettings}
                  style={{ background: !isEditingSettings ? 'rgba(0,0,0,0.01)' : 'white' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: '800', letterSpacing: '0.5px' }}>{language === 'en' ? 'AUTOMATICALLY GENERATED WHATSAPP LINK' : 'தானாக உருவான வாட்ஸ்அப் இணைப்பு'}</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '0.5rem 0.75rem' }}>
                <input 
                  type="text" 
                  value={phoneSetting.replace(/[^0-9]/g, '') ? `https://wa.me/${phoneSetting.replace(/[^0-9]/g, '')}` : 'https://wa.me/...'} 
                  readOnly 
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-secondary)', outline: 'none', fontStyle: 'normal', fontSize: '1rem' }} 
                />
                <button 
                  type="button" 
                  onClick={() => {
                    const cleanNumber = phoneSetting.replace(/[^0-9]/g, '');
                    if (cleanNumber) {
                       window.open(`https://wa.me/${cleanNumber}`, '_blank');
                    }
                  }} 
                  className="btn" 
                  style={{ background: '#0d5c3a', color: 'white', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: '700', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', transition: 'background-color 0.2s' }}
                  disabled={!phoneSetting.replace(/[^0-9]/g, '')}
                >
                  <MessageSquare size={14} /> {language === 'en' ? 'Test Link' : 'இணைப்பைச் சோதிக்க'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Listings Section (Full Width) */}
        {loadingListings ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--primary-color)' }} />
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>{language === 'en' ? 'Loading farm database...' : 'பண்ணைத் தரவுத்தளத்தை ஏற்றுகிறது...'}</p>
            {showWakeupMessage && (
              <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0.75rem auto 0 auto', lineHeight: '1.4' }}>
                ⚠️ {language === 'en' 
                  ? 'Note: Render Database Server is waking up from sleep. This may take up to 45 seconds on the first visit...' 
                  : 'குறிப்பு: தரவுத்தள சேவையகம் தூக்கத்திலிருந்து துவங்குகிறது. முதல் முறை தொடங்க 45 வினாடிகள் வரை ஆகலாம்...'}
              </p>
            )}
          </div>
        ) : listings.length === 0 ? (
          <div className="empty-state" style={{ padding: '6rem 2rem' }}>
            <div className="empty-icon">📂</div>
            <h3>No Livestock Registered</h3>
            <p style={{ marginBottom: '1.5rem' }}>Start listing your cows and goats to show them to potential customers.</p>
            <button onClick={() => openModal()} className="btn-primary" style={{ margin: '0 auto', borderRadius: '8px' }}>
              <Plus size={18} /> Add Your First Listing
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>{language === 'en' ? 'Media' : 'புகைப்படம்/வீடியோ'}</th>
                  <th>{language === 'en' ? 'Animal Name' : 'பெயர்'}</th>
                  <th>{language === 'en' ? 'Category' : 'பிரிவு'}</th>
                  <th>{language === 'en' ? 'Gender' : 'பாலினம்'}</th>
                  <th>{language === 'en' ? 'Breed' : 'இனம்'}</th>
                  <th>{language === 'en' ? 'Age' : 'வயது'}</th>
                  <th>{language === 'en' ? 'Daily Milk' : 'தினசரி பால்'}</th>
                  <th>{language === 'en' ? 'Calf/Kid Status' : 'கன்று/ஆட்டுக்குட்டி நிலை'}</th>
                  <th>{language === 'en' ? 'Price' : 'விலை'}</th>
                  <th>{language === 'en' ? 'Status' : 'இருப்பு நிலை'}</th>
                  <th>{language === 'en' ? 'Actions' : 'செயல்கள்'}</th>
                </tr>
              </thead>
              <tbody>
                {listings.map(item => {
                  const id = item._id || item.id;
                  const firstMedia = item.media && item.media.length > 0 
                    ? item.media[0] 
                    : { type: 'image', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80' };
                  
                  return (
                    <tr key={id}>
                      <td>
                        {firstMedia.type === 'video' ? (
                          <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                            <video className="table-thumb" src={firstMedia.url} muted />
                            <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'black', color: 'white', fontSize: '0.55rem', padding: '1px 3px', borderRadius: '2px', fontWeight: 800 }}>
                              VIDEO
                            </span>
                          </div>
                        ) : (
                          <img className="table-thumb" src={firstMedia.url} alt="" />
                        )}
                      </td>
                      <td>
                        <strong>{item.animalName}</strong>
                      </td>
                      <td>
                        <strong style={{ textTransform: 'capitalize' }}>{translateCategory(item.animalType, language)}</strong>
                      </td>
                      <td>
                        <span className={`gender-badge ${item.gender.toLowerCase()}`} style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', background: item.gender === 'Male' ? '#e1f5fe' : '#fce4ec', color: item.gender === 'Male' ? '#0288d1' : '#c2185b' }}>
                          {translateGender(item.gender, language)}
                        </span>
                      </td>
                      <td>{item.breed}</td>
                      <td>{item.age}</td>
                      <td>
                        {item.milkCapacity !== null && item.milkCapacity !== undefined && item.milkCapacity !== '' 
                          ? `${item.milkCapacity} ${language === 'en' ? 'Liters' : 'லிட்டர்'}` 
                          : '—'}
                      </td>
                      <td>{item.calfKidStatus || '—'}</td>
                      <td><strong>{formatPrice(item.price)}</strong></td>
                      <td>
                        <span 
                          onClick={() => handleToggleStatus(item)}
                          className={`status-badge ${item.status.toLowerCase()}`}
                          style={{ cursor: 'pointer' }}
                          title={language === 'en' ? "Click to toggle status" : "மாற்ற கிளிக் செய்யவும்"}
                        >
                          {translateStatus(item.status, language)}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button onClick={() => openModal(item)} className="btn-secondary" style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '4px', fontSize: '0.8rem' }} title="Edit Listing">
                            <Edit2 size={12} /> Edit
                          </button>
                          <button onClick={() => handleDeleteListing(id)} className="btn-danger" style={{ padding: '0.4rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }} title="Delete Listing">
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingListing ? (language === 'en' ? 'Edit Livestock Listing' : 'கால்நடை விவரங்களை திருத்து') : (language === 'en' ? 'Add New Livestock' : 'புதிய கால்நடை சேர்')}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveListing}>
              <div className="modal-body">
                {/* Form fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Animal Name *' : 'கால்நடை பெயர் *'}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={animalName} 
                      onChange={(e) => setAnimalName(e.target.value)} 
                      placeholder={language === 'en' ? "e.g. Lakshmi, Ponni" : "எ.கா: லட்சுமி, பொன்னி"} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Category *' : 'பிரிவு *'}</label>
                    <select className="form-select" value={animalType} onChange={(e) => {
                      setAnimalType(e.target.value);
                      setCalfKidStatus('');
                      setCustomCalfKidStatus('');
                    }}>
                      <option value="Cow">{language === 'en' ? 'Cow' : 'பசு மாடு'}</option>
                      <option value="Goat">{language === 'en' ? 'Goat' : 'ஆடு'}</option>
                      <option value="Cow Calf">{language === 'en' ? 'Cow Calf' : 'கன்றுக்குட்டி'}</option>
                      <option value="Goat Kid">{language === 'en' ? 'Goat Kid' : 'ஆட்டுக்குட்டி'}</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Gender *' : 'பாலினம் *'}</label>
                    <select className="form-select" value={gender} onChange={(e) => {
                      setGender(e.target.value);
                      if (e.target.value === 'Male') {
                        setMilkCapacity('');
                        setCalfKidStatus('');
                        setCustomCalfKidStatus('');
                      }
                    }}>
                      <option value="Female">{language === 'en' ? 'Female' : 'பெண்'}</option>
                      <option value="Male">{language === 'en' ? 'Male' : 'ஆண்'}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Breed Name *' : 'இனத்தின் பெயர் *'}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={breed} 
                      onChange={(e) => setBreed(e.target.value)} 
                      placeholder={language === 'en' ? "e.g. Jersey, Gir, Boer" : "எ.கா: ஜெர்சி, கிர், போயர்"} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Teeth Count *' : 'பற்களின் எண்ணிக்கை *'}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={teethCount} 
                      onChange={(e) => setTeethCount(e.target.value)} 
                      placeholder={language === 'en' ? "e.g. 2, 4, Milk Teeth" : "எ.கா: 2, 4, பால் பற்கள்"} 
                      required 
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{language === 'en' ? 'Age *' : 'வயது *'}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={age} 
                      onChange={(e) => setAge(e.target.value)} 
                      placeholder={language === 'en' ? "e.g. 2 Years 6 Months, or 2.5 Years" : "எ.கா: 2 வயது 6 மாதம், அல்லது 2.5 ஆண்டுகள்"} 
                      required 
                    />
                  </div>
                </div>

                {/* Helper constant for conditional milk & status display */}
                {(() => {
                  const isAdultFemale = (animalType === 'Cow' || animalType === 'Goat') && gender === 'Female';
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: isAdultFemale ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {isAdultFemale && (
                          <div className="form-group">
                            <label className="form-label">
                              {language === 'en' ? 'Daily Milk Capacity (Liters) ' : 'தினசரி பால் அளவு (லிட்டர்) '}
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>({language === 'en' ? 'Optional' : 'விரும்பினால்'})</span>
                            </label>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={milkCapacity} 
                              onChange={(e) => setMilkCapacity(e.target.value)} 
                              placeholder={language === 'en' ? "e.g. 10, 12-15 Liters (Optional)" : "எ.கா: 10, 12-15 லிட்டர் (விரும்பினால்)"} 
                            />
                          </div>
                        )}
                        <div className="form-group">
                           <label className="form-label">{language === 'en' ? 'Price (INR ₹) *' : 'விலை (ரூபாய் ₹) *'}</label>
                           <input 
                             type="number" 
                             className="form-input" 
                             value={price} 
                             onChange={(e) => setPrice(e.target.value)} 
                             placeholder="e.g. 65000" 
                             min="0"
                             required 
                           />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isAdultFemale ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label className="form-label">{language === 'en' ? 'Availability Status *' : 'இருப்பு நிலை *'}</label>
                          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="Available">{language === 'en' ? 'Available' : 'விற்பனைக்கு உள்ளது'}</option>
                            <option value="Sold">{language === 'en' ? 'Sold' : 'விற்பனையானது'}</option>
                          </select>
                        </div>
                        {isAdultFemale && (
                          <div className="form-group">
                            <label className="form-label">
                              {(animalType === 'Cow' || animalType === 'Cow Calf') 
                                ? (language === 'en' ? 'Calf Status (Optional)' : 'கன்றுக்குட்டி நிலை (விரும்பினால்)') 
                                : (language === 'en' ? 'Kid Status (Optional)' : 'ஆட்டுக்குட்டி நிலை (விரும்பினால்)')}
                            </label>
                            <select 
                              className="form-select" 
                              value={calfKidStatus} 
                              onChange={(e) => {
                                setCalfKidStatus(e.target.value);
                                if (e.target.value !== 'Custom...') {
                                  setCustomCalfKidStatus('');
                                }
                              }}
                            >
                              <option value="">{language === 'en' ? '-- Select Status --' : '-- நிலையைத் தேர்ந்தெடுக்கவும் --'}</option>
                              {(animalType === 'Cow' || animalType === 'Cow Calf') ? (
                                <>
                                  <option value="No Calf">{language === 'en' ? 'No Calf' : 'கன்றுக்குட்டி இல்லை'}</option>
                                  <option value="Male Calf">{language === 'en' ? 'Male Calf' : 'ஆண் கன்றுக்குட்டி'}</option>
                                  <option value="Female Calf">{language === 'en' ? 'Female Calf' : 'பெண் கன்றுக்குட்டி'}</option>
                                  <option value="One Male, One Female">{language === 'en' ? 'One Male, One Female' : 'ஒரு ஆண், ஒரு பெண்'}</option>
                                </>
                              ) : (
                                <>
                                  <option value="No Kid">{language === 'en' ? 'No Kid' : 'ஆட்டுக்குட்டி இல்லை'}</option>
                                  <option value="Male Kid">{language === 'en' ? 'Male Kid' : 'ஆண் ஆட்டுக்குட்டி'}</option>
                                  <option value="Female Kid">{language === 'en' ? 'Female Kid' : 'பெண் ஆட்டுக்குட்டி'}</option>
                                  <option value="One Male, One Female">{language === 'en' ? 'One Male, One Female' : 'ஒரு ஆண், ஒரு பெண்'}</option>
                                </>
                              )}
                              <option value="Custom...">{language === 'en' ? 'Custom Option' : 'விருப்ப நிலை (Custom)'}</option>
                            </select>
                          </div>
                        )}
                      </div>

                      {isAdultFemale && calfKidStatus === 'Custom...' && (
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                          <label className="form-label">
                            {(animalType === 'Cow' || animalType === 'Cow Calf') 
                              ? (language === 'en' ? 'Enter Custom Calf Status *' : 'விருப்ப கன்றுக்குட்டி நிலையை உள்ளிடவும் *') 
                              : (language === 'en' ? 'Enter Custom Kid Status *' : 'விருப்ப ஆட்டுக்குட்டி நிலையை உள்ளிடவும் *')}
                          </label>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={customCalfKidStatus} 
                            onChange={(e) => setCustomCalfKidStatus(e.target.value)} 
                            placeholder={language === 'en' ? "e.g. Twins Male, Pregnant again" : "எ.கா: இரட்டை ஆண் கன்றுகள்"}
                            required 
                          />
                        </div>
                      )}
                    </>
                  );
                })()}

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">{language === 'en' ? 'Unique Description & Details *' : 'குறிப்புகள் & விவரங்கள் *'}</label>
                  <textarea 
                    className="form-textarea" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder={language === 'en' ? "Describe details like health status, vaccination status, delivery counts, behavior traits..." : "சுகாதார நிலை, தடுப்பூசி விவரங்கள், ஈற்று எண்ணிக்கை போன்றவற்றை விவரிக்கவும்..."} 
                    required={!voiceDescription}
                  />

                  {/* Voice Description Section */}
                  <div style={{ marginTop: '1rem', border: '1px dashed var(--border-color)', padding: '1rem', borderRadius: '8px', background: 'var(--primary-glow)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span className="form-label" style={{ fontWeight: '700', margin: 0 }}>
                        {language === 'en' ? '🎙️ Voice Description' : '🎙️ குரல் வழி விளக்கம்'}
                      </span>
                      {voiceDescription && (
                        <button 
                          type="button" 
                          onClick={() => setVoiceDescription('')} 
                          className="btn-secondary" 
                          style={{ color: 'var(--alert-error-color)', border: '1px solid var(--alert-error-color)', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {language === 'en' ? 'Delete Voice' : 'குரல் பதிவை நீக்கு'}
                        </button>
                      )}
                    </div>

                    {voiceDescription ? (
                      <div>
                        <audio src={voiceDescription} controls style={{ width: '100%', borderRadius: '4px' }} />
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                          type="button" 
                          onClick={isRecording ? stopRecording : startRecording} 
                          className={`btn ${isRecording ? 'btn-logout' : 'btn-primary'}`}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', border: 'none', fontWeight: '600', fontSize: '0.85rem' }}
                        >
                          {isRecording ? (
                            <>
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'red', animation: 'pulse 1s infinite' }}></span>
                              {language === 'en' ? 'Stop Recording' : 'பதிவை நிறுத்தவும்'}
                            </>
                          ) : (
                            <>
                              <span>🎙️</span>
                              {language === 'en' ? 'Record Voice Note' : 'குரல் பதிவு செய்ய'}
                            </>
                          )}
                        </button>

                        <button 
                          type="button" 
                          onClick={() => audioFileInputRef.current.click()} 
                          className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', border: '1px solid var(--border-color)', background: 'white' }}
                        >
                          📁 {language === 'en' ? 'Upload Audio File' : 'ஒலி கோப்பை பதிவேற்ற'}
                        </button>

                        <input 
                          type="file" 
                          ref={audioFileInputRef} 
                          style={{ display: 'none' }} 
                          accept="audio/*" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              uploadAudioFile(e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Media uploads */}
                <div className="form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="form-label">{language === 'en' ? 'Photos & Videos (Responsive Uploads) *' : 'புகைப்படங்கள் & வீடியோக்கள் *'}</label>
                  
                  {uploadError && (
                    <div className="alert alert-error" style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertCircle size={14} />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                    <div className="upload-icon">
                      {uploading ? <RefreshCw className="animate-spin" size={32} /> : <Upload size={32} />}
                    </div>
                    <h3>{language === 'en' ? 'Click to select media file' : 'புகைப்படம் அல்லது வீடியோவை தேர்ந்தெடுக்கவும்'}</h3>
                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                      {language === 'en' ? 'Supports Images (JPG, PNG, WEBP) & Videos (MP4) up to 50MB' : 'புகைப்படங்கள் மற்றும் வீடியோக்கள் (அதிகபட்சம் 50MB) ஆதரிக்கப்படும்'}
                    </p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="upload-input" 
                      onChange={handleUploadFile}
                      accept="image/*,video/*"
                      disabled={uploading}
                    />
                  </div>

                  {uploading && (
                    <div className="progress-bar-wrapper">
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                      <div className="progress-text">
                        <span>Uploading media...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                    </div>
                  )}

                  {/* Media Preview Grid */}
                  {media.length > 0 && (
                    <div className="upload-gallery">
                      {media.map((item, idx) => (
                        <div className="upload-item" key={idx}>
                          <button type="button" className="upload-item-remove" onClick={() => removeMediaItem(idx)}>
                            <X size={12} />
                          </button>
                          {item.type === 'video' ? (
                            <video src={item.url} muted />
                          ) : (
                            <img src={item.url} alt="" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'ரத்து செய்'}
                </button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                  <Save size={18} /> {editingListing ? (language === 'en' ? 'Update Listing' : 'சேமிக்கவும்') : (language === 'en' ? 'Publish Listing' : 'வெளியிடவும்')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
