import React, { useState, useEffect } from 'react';
import { Search, Phone, MessageSquare, MapPin, Eye, Play, X, ChevronLeft, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import logoImg from './logo.jpg';

// Editable Farm Configuration
const FARM_CONFIG = {
  phone: '+919876543210', // Substitute with real Sekar Dairy Farm number
  whatsappMessage: 'Hello, I am interested in: ',
  googleMapsUrl: 'https://maps.google.com/?q=Sekar+Dairy+Farm+Livestock' // Substiture with exact coordinates
};

// API Endpoint URL
const API_BASE = import.meta.env.VITE_API_URL || '';

// Redesigned brand quotes
const BRAND_QUOTES = [
  "Nurturing premium quality livestock with expert care, powering family dairy traditions since 2012.",
  "Where health meets heritage: handpicked, verified livestock for your farm and dairy operations.",
  "High-yielding milk genetics, pure breed verification, and trusted service across generations."
];

const translateCategory = (type, lang) => {
  if (lang === 'ta') {
    if (type === 'Cow') return 'மாடு';
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
  const [language, setLanguage] = useState(localStorage.getItem('sekar_lang') || 'en');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWakeupMessage, setShowWakeupMessage] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setShowWakeupMessage(true);
      }, 3500);
    } else {
      setShowWakeupMessage(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);
  
  // Vendor Info State
  const [vendorInfo, setVendorInfo] = useState({
    phone: '+919876543210',
    whatsappLink: 'https://wa.me/919876543210',
    mapsUrl: 'https://maps.google.com/?q=Sekar+Dairy+Farm'
  });
  
  // Search & Filters State
  const [search, setSearch] = useState('');
  const [animalType, setAnimalType] = useState('All');
  const [status, setStatus] = useState('Available'); // Default show available
  const [maxPrice, setMaxPrice] = useState('');
  
  // Media sliders index state
  const [mediaIndexes, setMediaIndexes] = useState({});
  
  // Lightbox modal state (photo/video full view)
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Expanded descriptions state hook
  const [expandedDescs, setExpandedDescs] = useState({});

  const toggleDesc = (id) => {
    setExpandedDescs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Swipe/Drag gesture state
  const [dragStartX, setDragStartX] = useState(0);
  const [isSwipeAction, setIsSwipeAction] = useState(false);

  const handleDragStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setIsSwipeAction(false);
  };

  const handleDragEnd = (e, id, mediaLength) => {
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    if (!dragStartX || !clientX) return;
    const diff = dragStartX - clientX;
    setDragStartX(0);
    
    if (Math.abs(diff) > 15) {
      setIsSwipeAction(true);
    }

    if (diff > 50) {
      nextMedia(id, mediaLength);
    } else if (diff < -50) {
      prevMedia(id, mediaLength);
    }
  };

  // Quote rotational index
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % BRAND_QUOTES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch vendor contact info
  const fetchVendorInfo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/vendor-info`);
      if (response.ok) {
        const data = await response.json();
        setVendorInfo(data);
      }
    } catch (err) {
      console.error('Error fetching vendor info:', err);
    }
  };

  // Fetch listings from backend
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams();
      if (animalType !== 'All') params.append('animalType', animalType);
      if (status !== 'All') params.append('status', status);
      if (maxPrice) params.append('maxPrice', maxPrice);
      
      const response = await fetch(`${API_BASE}/api/listings?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch livestock listings.');
      }
      const data = await response.json();
      setListings(data);
      
      // Initialize media indexes
      const indexes = {};
      data.forEach(item => {
        indexes[item._id || item.id] = 0;
      });
      setMediaIndexes(indexes);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchVendorInfo();
  }, [animalType, status, maxPrice]);

  // Client-side search filter
  const filteredListings = listings.filter(item => {
    const term = search.toLowerCase();
    return (
      (item.breed && item.breed.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.animalName && item.animalName.toLowerCase().includes(term))
    );
  });

  // Handle media slider navigation
  const prevMedia = (id, mediaCount) => {
    setMediaIndexes(prev => ({
      ...prev,
      [id]: prev[id] === 0 ? mediaCount - 1 : prev[id] - 1
    }));
  };

  const nextMedia = (id, mediaCount) => {
    setMediaIndexes(prev => ({
      ...prev,
      [id]: prev[id] === mediaCount - 1 ? 0 : prev[id] + 1
    }));
  };

  // Helper: Format price in Indian Rupees (INR)
  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="luxury-wrapper">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="logo" onClick={() => window.location.reload()}>
          <div className="logo-badge" style={{ overflow: 'hidden', padding: 0 }}>
            <img src={logoImg} alt="Sekar Dairy Farm Logo" className="logo-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="logo-text-wrapper">
            <span className="logo-brand">S E K A R</span>
            <span className="logo-subbrand">{language === 'en' ? 'DAIRY FARM' : 'டெய்ரி ஃபார்ம்'}</span>
          </div>
        </div>
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => {
              const nextLang = language === 'en' ? 'ta' : 'en';
              setLanguage(nextLang);
              localStorage.setItem('sekar_lang', nextLang);
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
            className="lang-toggle-btn"
          >
            🌐 {language === 'en' ? 'தமிழ்' : 'English'}
          </button>
          <a href="#" className="nav-link active">{language === 'en' ? 'Livestock Listings' : 'கால்நடை பட்டியல்கள்'}</a>
          <a href={vendorInfo.mapsUrl} target="_blank" rel="noopener noreferrer" className="nav-link visit-btn">
            {language === 'en' ? 'Visit Farm' : 'பண்ணையை பார்வையிட'} ↗
          </a>
        </div>
      </header>

      {/* Unique Centered Hero Section */}
      <section className="hero-asymmetric" style={{ display: 'block', margin: '3rem auto', textAlign: 'center' }}>
        <div className="hero-text-block" style={{ alignItems: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <span className="hero-tagline">{language === 'en' ? 'ESTABLISHED 2012 • VERIFIED BREEDING' : 'தொடக்கம் 2012 • சரிபார்க்கப்பட்ட இனப்பெருக்கம்'}</span>
          <h1 className="hero-title" style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: 1.25 }}>
            {language === 'en' ? 'Refined Heritage & Elite Livestock.' : 'பாரம்பரிய பெருமை & உயர்ரக கால்நடைகள்.'}
          </h1>
        </div>
      </section>

      <main className="container">
        {/* Unified Modern Control Bar */}
        <section className="control-bar-wrapper">
          <div className="unified-control-bar">
            <div className="control-field search-field">
              <Search size={18} className="control-icon" />
              <input 
                type="text" 
                placeholder={language === 'en' ? "Search breeds or listings..." : "மாட்டின் இனம் அல்லது பெயர் கொண்டு தேடவும்..."} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="control-field divider"></div>
            
            <div className="control-field select-field">
              <span className="field-label">{language === 'en' ? 'Category' : 'பிரிவு'}</span>
              <select value={animalType} onChange={(e) => setAnimalType(e.target.value)}>
                <option value="All">{language === 'en' ? 'All Categories' : 'அனைத்துப் பிரிவுகள்'}</option>
                <option value="Cow">{language === 'en' ? 'Cow' : 'பசு மாடு'}</option>
                <option value="Goat">{language === 'en' ? 'Goat' : 'ஆடு'}</option>
                <option value="Cow Calf">{language === 'en' ? 'Cow Calf' : 'கன்றுக்குட்டி'}</option>
                <option value="Goat Kid">{language === 'en' ? 'Goat Kid' : 'ஆட்டுக்குட்டி'}</option>
              </select>
            </div>
            
            <div className="control-field divider"></div>
            
            <div className="control-field select-field">
              <span className="field-label">{language === 'en' ? 'Availability' : 'இருப்பு நிலை'}</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Available">{language === 'en' ? 'Available Only' : 'விற்பனைக்கு உள்ளவை'}</option>
                <option value="Sold">{language === 'en' ? 'Sold listings' : 'விற்பனையானவை'}</option>
                <option value="All">{language === 'en' ? 'Show All' : 'அனைத்தையும் காட்டு'}</option>
              </select>
            </div>
            
            <div className="control-field divider"></div>
            
            <div className="control-field select-field price-field">
              <span className="field-label">{language === 'en' ? 'Max Price' : 'அதிகபட்ச விலை'}</span>
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}>
                <option value="">{language === 'en' ? 'Any Price' : 'எந்த விலையும்'}</option>
                <option value="25000">{language === 'en' ? 'Under ₹25,000' : '₹25,000க்கு கீழ்'}</option>
                <option value="50000">{language === 'en' ? 'Under ₹50,000' : '₹50,000க்கு கீழ்'}</option>
                <option value="75000">{language === 'en' ? 'Under ₹75,000' : '₹75,000க்கு கீழ்'}</option>
                <option value="100000">{language === 'en' ? 'Under ₹1,00,000' : '₹1,00,000க்கு கீழ்'}</option>
                <option value="150000">{language === 'en' ? 'Under ₹1,50,000' : '₹1,50,000க்கு கீழ்'}</option>
              </select>
            </div>

            <div className="control-field refresh-field">
              <button 
                onClick={fetchListings} 
                className="refresh-btn" 
                title="Refresh Listings"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Listings Display */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--primary-color)' }} />
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>{language === 'en' ? 'Loading premium listings...' : 'தரமான கால்நடைகளை ஏற்றுகிறது...'}</p>
            {showWakeupMessage && (
              <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '400px', margin: '0.75rem auto 0 auto', lineHeight: '1.4' }}>
                ⚠️ {language === 'en' 
                  ? 'Note: Render Database Server is waking up from sleep. This may take up to 45 seconds on the first visit...' 
                  : 'குறிப்பு: தரவுத்தள சேவையகம் தூக்கத்திலிருந்து துவங்குகிறது. முதல் முறை தொடங்க 45 வினாடிகள் வரை ஆகலாம்...'}
              </p>
            )}
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <h3>{language === 'en' ? 'Could Not Connect to Database' : 'தரவுத்தளத்துடன் இணைக்க முடியவில்லை'}</h3>
            <p>{error}</p>
            <button onClick={fetchListings} className="btn btn-call" style={{ margin: '1rem auto 0 auto', width: 'auto' }}>
              {language === 'en' ? 'Try Again' : 'மீண்டும் முயற்சி செய்'}
            </button>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🐄</div>
            <h3>{language === 'en' ? 'No Listings Found' : 'கால்நடைகள் எதுவும் இல்லை'}</h3>
            <p>{language === 'en' ? "We couldn't find any livestock matching your current filter criteria." : "உங்களது தேடலுக்குப் பொருத்தமான கால்நடைகள் எதுவும் கண்டறியப்படவில்லை."}</p>
          </div>
        ) : (
          <div className="listings-grid">
            {filteredListings.map(item => {
              const id = item._id || item.id;
              const currentMediaIdx = mediaIndexes[id] || 0;
              const mediaList = item.media && item.media.length > 0 
                ? item.media 
                : [{ type: 'image', url: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80', public_id: 'default' }]; // Unsplash placeholder cow if none uploaded
              const currentMedia = mediaList[currentMediaIdx];

              let waLink = vendorInfo.whatsappLink;
              if (waLink && waLink.includes('wa.me') && !waLink.includes('text=')) {
                const separator = waLink.includes('?') ? '&' : '?';
                waLink += `${separator}text=${encodeURIComponent(FARM_CONFIG.whatsappMessage + item.animalName + ' - ' + item.breed + ' (₹' + item.price + ')')}`;
              }

              return (
                <div className="listing-card" key={id}>
                  {/* Media Container with Swipe gesture support */}
                  <div 
                    className="card-media-wrapper"
                    onTouchStart={handleDragStart}
                    onTouchEnd={(e) => handleDragEnd(e, id, mediaList.length)}
                    onMouseDown={handleDragStart}
                    onMouseUp={(e) => handleDragEnd(e, id, mediaList.length)}
                    style={{ cursor: mediaList.length > 1 ? 'grab' : 'default', userSelect: 'none' }}
                  >
                    {/* Badge availability */}
                    <span className={`badge ${item.status.toLowerCase()}`}>
                      {translateStatus(item.status, language)}
                    </span>

                    {/* Indicator Dots only, arrow buttons removed */}
                    {mediaList.length > 1 && (
                      <div className="media-dots">
                        {mediaList.map((_, i) => (
                          <span 
                            className={`media-dot ${i === currentMediaIdx ? 'active' : ''}`} 
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaIndexes(prev => ({ ...prev, [id]: i }));
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Image / Video render */}
                    {currentMedia.type === 'video' ? (
                      <div 
                        style={{ position: 'relative', width: '100%', height: '100%', cursor: 'zoom-in' }} 
                        onClick={(e) => {
                          if (isSwipeAction) {
                            setIsSwipeAction(false);
                            return;
                          }
                          setSelectedMedia(currentMedia);
                        }}
                      >
                        <video className="card-media" src={currentMedia.url} muted playsInline draggable="false" onDragStart={(e) => e.preventDefault()} />
                        <div className="video-play-overlay">
                          <Play size={24} fill="currentColor" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        className="card-media" 
                        src={currentMedia.url} 
                        alt={`${item.breed}`} 
                        draggable="false" 
                        onDragStart={(e) => e.preventDefault()} 
                        style={{ cursor: 'zoom-in' }}
                        onClick={(e) => {
                          if (isSwipeAction) {
                            setIsSwipeAction(false);
                            return;
                          }
                          setSelectedMedia(currentMedia);
                        }}
                      />
                    )}
                  </div>

                  {/* Listing Details */}
                  <div className="card-details">
                    <div className="card-title-row">
                      <div>
                        <h3 className="card-breed" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                          {item.animalName}
                        </h3>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--primary-color)', background: 'var(--primary-glow)', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.25rem', border: '1px solid var(--border-color)', textTransform: 'capitalize' }}>
                          {item.breed} ({translateCategory(item.animalType, language)} • {translateGender(item.gender, language)})
                        </span>
                      </div>
                      <div className="card-price">{formatPrice(item.price)}</div>
                    </div>
                    
                    {/* Animal Specifications */}
                    <div className="specs-grid">
                      <div className="spec-item">
                        <span className="spec-label">{language === 'en' ? 'Age' : 'வயது'}</span>
                        <span className="spec-value">{item.age}</span>
                      </div>
                      <div className="spec-item">
                        <span className="spec-label">{language === 'en' ? 'Teeth' : 'பற்கள்'}</span>
                        <span className="spec-value">{item.teethCount}</span>
                      </div>
                      {item.milkCapacity !== null && item.milkCapacity !== undefined && item.milkCapacity !== '' && (
                        <div className="spec-item">
                          <span className="spec-label">{language === 'en' ? 'Daily Milk' : 'தினசரி பால்'}</span>
                          <span className="spec-value">{item.milkCapacity} {language === 'en' ? 'L' : 'லிட்டர்'}</span>
                        </div>
                      )}
                    </div>


                    {item.description && (
                      <p className="card-desc" style={{ whiteSpace: 'pre-line', height: 'auto', maxHeight: 'none', display: 'block', overflow: 'visible', margin: '0.5rem 0' }}>
                        {(() => {
                          const desc = item.description || '';
                          const isExpanded = !!expandedDescs[id];
                          const maxLength = 120;
                          
                          if (desc.length <= maxLength) {
                            return <span>{desc}</span>;
                          }
                          
                          return (
                            <span>
                              {isExpanded ? desc : `${desc.slice(0, maxLength)}...`}
                              <button 
                                onClick={() => toggleDesc(id)} 
                                style={{ 
                                  background: 'transparent', 
                                  border: 'none', 
                                  color: 'var(--primary-color)', 
                                  fontWeight: '700', 
                                  fontSize: '0.85rem', 
                                  marginLeft: '0.35rem', 
                                  cursor: 'pointer',
                                  padding: 0,
                                  textDecoration: 'underline',
                                  fontFamily: 'inherit'
                                }}
                              >
                                {isExpanded ? (language === 'en' ? 'Read Less' : 'சுருக்கவும்') : (language === 'en' ? 'Read More' : 'மேலும் படிக்க')}
                              </button>
                            </span>
                          );
                        })()}
                      </p>
                    )}

                    {item.voiceDescription && (
                      <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem', background: 'var(--primary-glow)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          🔊 {language === 'en' ? 'Voice Description' : 'குரல் வழி விளக்கம்'}
                        </span>
                        <audio src={item.voiceDescription} controls style={{ width: '100%', height: '40px', borderRadius: '4px', outline: 'none' }} />
                      </div>
                    )}

                    {item.calfKidStatus && (
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary-glow)', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <span>{(item.animalType === 'Cow' || item.animalType === 'Cow Calf') ? '🐄' : '🐐'}</span>
                        <span>
                          {(item.animalType === 'Cow' || item.animalType === 'Cow Calf') 
                            ? (language === 'en' ? 'Calf Status: ' : 'கன்றுக்குட்டி நிலை: ') 
                            : (language === 'en' ? 'Kid Status: ' : 'ஆட்டுக்குட்டி நிலை: ')}
                          <strong>{item.calfKidStatus}</strong>
                        </span>
                      </div>
                    )}

                    {/* Interactive Buttons (Call, WhatsApp, Maps) */}
                    <div className="card-actions">
                      <a href={`tel:${vendorInfo.phone}`} className="btn btn-call" title={language === 'en' ? 'Call Farm' : 'பண்ணையை அழைக்க'}>
                        <Phone size={16} /> {language === 'en' ? 'Call' : 'அழைக்கவும்'}
                      </a>
                      
                      {vendorInfo.whatsappLink && (
                        <a 
                          href={waLink} 
                          className="btn btn-whatsapp" 
                          title={language === 'en' ? 'WhatsApp Enquiry' : 'வாட்ஸ்அப் விசாரணை'}
                        >
                          <MessageSquare size={16} /> {language === 'en' ? 'WhatsApp' : 'வாட்ஸ்அப்'}
                        </a>
                      )}
                      
                      <a 
                        href={vendorInfo.mapsUrl} 
                        className="btn btn-maps" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title={language === 'en' ? 'View Location' : 'முகவரி பார்க்க'}
                      >
                        <MapPin size={16} /> {language === 'en' ? 'Location' : 'முகவரி'}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>



      {/* Lightbox / Full View Modal */}
      {selectedMedia && (
        <div className="modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '850px', background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <button className="modal-close" onClick={() => setSelectedMedia(null)} style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#121a16' }}>
              <X size={20} />
            </button>
            {selectedMedia.type === 'video' ? (
              <video className="modal-video" src={selectedMedia.url} controls autoPlay style={{ borderRadius: '12px', maxHeight: '80vh', objectFit: 'contain', background: '#000' }} />
            ) : (
              <img src={selectedMedia.url} alt="Full view" style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }} />
            )}
            <div className="modal-info" style={{ background: 'white', borderRadius: '12px', marginTop: '1rem', padding: '1.25rem' }}>
              <h3>
                {selectedMedia.type === 'video' 
                  ? (language === 'en' ? '📽️ Livestock Video Tour' : '📽️ கால்நடை வீடியோ ஆய்வு') 
                  : (language === 'en' ? '📸 Full-Size Photo' : '📸 முழு அளவு புகைப்படம்')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {language === 'en' ? 'Sekar Dairy Farm verified high-quality media inspection.' : 'சேகர் டெய்ரி ஃபார்ம் சரிபார்க்கப்பட்ட உயர்ரக ஊடக ஆய்வு.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <footer>
        <p>&copy; {new Date().getFullYear()} {language === 'en' ? 'Sekar Dairy Farm. All Rights Reserved.' : 'சேகர் டெய்ரி ஃபார்ம். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.'}</p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
          {language === 'en' ? 'Breeding quality livestock for generations. Configured for quick Vercel & Render hosting.' : 'தலைமுறை தலைமுறையாக தரமான கால்நடை வளர்ப்பு. Vercel & Render இல் எளிதாக ஹோஸ்ட் செய்யப்பட்டுள்ளது.'}
        </p>
      </footer>
    </div>
  );
}

export default App;
