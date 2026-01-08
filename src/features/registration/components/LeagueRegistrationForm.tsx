import { useState, useEffect } from 'react';

interface League {
  id: string;
  name: string;
  slug: string;
  active: boolean;
}

interface Team {
  id: string;
  name: string;
}

interface TeamFormData {
  name: string;
  coachName: string;
  contactEmail: string;
  contactPhone: string;
  leagueId: string;
  additionalInfo: string;
}

interface PlayerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  jerseyNumber: string;
  height: string;
  weight: string;
  teamName: string;
  additionalInfo: string;
}

type TabType = 'team' | 'player';

export default function LeagueRegistrationForm() {
  const [activeTab, setActiveTab] = useState<TabType>('team');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [leaguesLoading, setLeaguesLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [teamFormData, setTeamFormData] = useState<TeamFormData>({
    name: '',
    coachName: '',
    contactEmail: '',
    contactPhone: '',
    leagueId: '',
    additionalInfo: '',
  });

  const [playerFormData, setPlayerFormData] = useState<PlayerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    jerseyNumber: '',
    height: '',
    weight: '',
    teamName: '',
    additionalInfo: '',
  });

  // Fetch leagues from database
  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        setLeaguesLoading(true);
        const response = await fetch('/api/leagues?active=true');
        if (response.ok) {
          const data = await response.json();
          setLeagues(data);
        }
      } catch (err) {
        console.error('Error fetching leagues:', err);
      } finally {
        setLeaguesLoading(false);
      }
    };

    fetchLeagues();
  }, []);

  // Fetch teams from database
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setTeamsLoading(true);
        const response = await fetch('/api/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data);
        }
      } catch (err) {
        console.error('Error fetching teams:', err);
      } finally {
        setTeamsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleTeamSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/registration/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamFormData.name.trim(),
          coachName: teamFormData.coachName.trim(),
          contactEmail: teamFormData.contactEmail.trim(),
          contactPhone: teamFormData.contactPhone.trim(),
          leagueId: teamFormData.leagueId || undefined,
          additionalInfo: teamFormData.additionalInfo.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit team registration');
      }

      // Reset form
      setTeamFormData({
        name: '',
        coachName: '',
        contactEmail: '',
        contactPhone: '',
        leagueId: '',
        additionalInfo: '',
      });
      setSuccess('Team and coach registration submitted successfully! We will contact you soon.');
    } catch (err) {
      console.error('Error submitting team registration:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit team registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayerSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/registration/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: playerFormData.firstName.trim(),
          lastName: playerFormData.lastName.trim(),
          email: playerFormData.email.trim(),
          phone: playerFormData.phone.trim(),
          position: playerFormData.position || undefined,
          jerseyNumber: playerFormData.jerseyNumber ? parseInt(playerFormData.jerseyNumber) : undefined,
          height: playerFormData.height.trim() || undefined,
          weight: playerFormData.weight.trim() || undefined,
          teamName: playerFormData.teamName.trim() || undefined,
          additionalInfo: playerFormData.additionalInfo.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit player registration');
      }

      // Reset form
      setPlayerFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        jerseyNumber: '',
        height: '',
        weight: '',
        teamName: '',
        additionalInfo: '',
      });
      setSuccess('Player registration submitted successfully! We will contact you soon.');
    } catch (err) {
      console.error('Error submitting player registration:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit player registration');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTeamFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlayerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlayerFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <style>{`
        .registration-form button.button {
          background-color: #dd3333 !important;
        }
        .registration-form button.button:disabled {
          background-color: #999 !important;
          opacity: 0.5 !important;
        }
        .registration-form button.button:hover:not(:disabled) {
          background-color: #c02929 !important;
        }
      `}</style>
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('team');
            setError(null);
            setSuccess(null);
          }}
          style={{
            padding: '12px 24px',
            background: activeTab === 'team' ? '#dd3333' : 'transparent',
            color: activeTab === 'team' ? '#fff' : '#363f48',
            border: 'none',
            borderBottom: activeTab === 'team' ? '3px solid #dd3333' : '3px solid transparent',
            cursor: 'pointer',
            fontFamily: 'Teko, sans-serif',
            fontSize: '18px',
            textTransform: 'uppercase',
            fontWeight: activeTab === 'team' ? '600' : '400',
            transition: 'all 0.3s ease',
          }}
        >
          Team Registration
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('player');
            setError(null);
            setSuccess(null);
          }}
          style={{
            padding: '12px 24px',
            background: activeTab === 'player' ? '#dd3333' : 'transparent',
            color: activeTab === 'player' ? '#fff' : '#363f48',
            border: 'none',
            borderBottom: activeTab === 'player' ? '3px solid #dd3333' : '3px solid transparent',
            cursor: 'pointer',
            fontFamily: 'Teko, sans-serif',
            fontSize: '18px',
            textTransform: 'uppercase',
            fontWeight: activeTab === 'player' ? '600' : '400',
            transition: 'all 0.3s ease',
          }}
        >
          Player Registration
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div style={{
          padding: '1rem 1.25rem',
          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
          color: '#065f46',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #6ee7b7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p style={{ margin: 0, fontWeight: '500' }}>{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          background: '#fee2e2',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          border: '1px solid #fecaca',
        }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Team Registration Form */}
      {activeTab === 'team' && (
        <form onSubmit={handleTeamSubmit} className="registration-form">
          <h3 className="heading-font" style={{ color: '#dd3333', marginBottom: '20px', fontSize: '24px', textAlign: 'center' }}>
            Team Registration Form
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
              Team Name <span style={{ color: '#dd3333' }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={teamFormData.name}
              onChange={handleTeamChange}
              placeholder="Enter team name"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
              Coach Name <span style={{ color: '#dd3333' }}>*</span>
            </label>
            <input
              type="text"
              name="coachName"
              value={teamFormData.coachName}
              onChange={handleTeamChange}
              placeholder="Enter coach name"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
              Contact Email <span style={{ color: '#dd3333' }}>*</span>
            </label>
            <input
              type="email"
              name="contactEmail"
              value={teamFormData.contactEmail}
              onChange={handleTeamChange}
              placeholder="Enter contact email"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
              Contact Phone <span style={{ color: '#dd3333' }}>*</span>
            </label>
            <input
              type="tel"
              name="contactPhone"
              value={teamFormData.contactPhone}
              onChange={handleTeamChange}
              placeholder="Enter contact phone"
              required
              style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
              League
            </label>
            <select
              name="leagueId"
              value={teamFormData.leagueId}
              onChange={handleTeamChange}
              disabled={leaguesLoading}
              style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
            >
              <option value="">Select League</option>
              {leagues.map((league) => (
                <option key={league.id} value={league.id}>
                  {league.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
              Additional Information
            </label>
            <textarea
              name="additionalInfo"
              value={teamFormData.additionalInfo}
              onChange={handleTeamChange}
              placeholder="Any additional information about your team"
              rows={5}
              style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              type="submit"
              disabled={submitting}
              className="button btn-primary btn-lg"
              style={{
                backgroundColor: submitting ? '#999' : '#dd3333',
                color: '#fff',
                border: 'none',
                padding: '15px 40px',
                fontFamily: 'Teko',
                fontSize: '18px',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                opacity: submitting ? 0.5 : 1,
              } as React.CSSProperties}
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      )}

      {/* Player Registration Form */}
      {activeTab === 'player' && (
        <form onSubmit={handlePlayerSubmit} className="registration-form">
          <h3 className="heading-font" style={{ color: '#dd3333', marginBottom: '20px', fontSize: '24px', textAlign: 'center' }}>
            Player Registration Form
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                First Name <span style={{ color: '#dd3333' }}>*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={playerFormData.firstName}
                onChange={handlePlayerChange}
                placeholder="Enter first name"
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Last Name <span style={{ color: '#dd3333' }}>*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={playerFormData.lastName}
                onChange={handlePlayerChange}
                placeholder="Enter last name"
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Email <span style={{ color: '#dd3333' }}>*</span>
              </label>
              <input
                type="email"
                name="email"
                value={playerFormData.email}
                onChange={handlePlayerChange}
                placeholder="Enter email"
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Phone <span style={{ color: '#dd3333' }}>*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={playerFormData.phone}
                onChange={handlePlayerChange}
                placeholder="Enter phone"
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Position
              </label>
              <select
                name="position"
                value={playerFormData.position}
                onChange={handlePlayerChange}
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              >
                <option value="">Select Position</option>
                <option value="Point Guard">Point Guard</option>
                <option value="Shooting Guard">Shooting Guard</option>
                <option value="Small Forward">Small Forward</option>
                <option value="Power Forward">Power Forward</option>
                <option value="Center">Center</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Jersey Number
              </label>
              <input
                type="number"
                name="jerseyNumber"
                value={playerFormData.jerseyNumber}
                onChange={handlePlayerChange}
                placeholder="e.g., 23"
                min="0"
                max="99"
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Team Name <span style={{ color: '#dd3333' }}>*</span>
              </label>
              <select
                name="teamName"
                value={playerFormData.teamName}
                onChange={handlePlayerChange}
                disabled={teamsLoading}
                required
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              >
                <option value="">Select Team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.name}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Height
              </label>
              <input
                type="text"
                name="height"
                value={playerFormData.height}
                onChange={handlePlayerChange}
                placeholder={'e.g., 6\'2"'}
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
                Weight
              </label>
              <input
                type="text"
                name="weight"
                value={playerFormData.weight}
                onChange={handlePlayerChange}
                placeholder="e.g., 180 lbs"
                style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#363f48', fontWeight: '600' }}>
              Additional Information
            </label>
            <textarea
              name="additionalInfo"
              value={playerFormData.additionalInfo}
              onChange={handlePlayerChange}
              placeholder="Any additional information about yourself"
              rows={5}
              style={{ width: '100%', padding: '12px', border: '1px solid #d8d8d8', borderRadius: '3px', fontFamily: 'Rubik', fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              type="submit"
              disabled={submitting}
              className="button btn-primary btn-lg"
              style={{
                backgroundColor: submitting ? '#999' : '#dd3333',
                color: '#fff',
                border: '2px solid #dd3333',
                padding: '15px 40px',
                fontFamily: 'Teko',
                fontSize: '18px',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                borderRadius: '3px',
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

