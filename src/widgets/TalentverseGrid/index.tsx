import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './TalentverseGrid.css';

export interface TalentProfile {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  skills: string[];
  rating?: number;
  hourlyRate?: string;
  availability?: 'available' | 'busy' | 'offline';
  bio?: string;
  profileUrl?: string;
}

export interface TalentverseConfig {
  id: string;
  title?: string;
  layout?: 'grid' | 'list';
  columns?: number;
  showFilters?: boolean;
  theme?: 'light' | 'dark';
}

export interface TalentverseData {
  profiles: TalentProfile[];
  skills?: string[];
}

interface TalentverseGridProps extends WidgetProps {
  config: TalentverseConfig;
  data: TalentverseData;
}

export const TalentverseGrid: React.FC<TalentverseGridProps> = ({ config, data, onEvent, analytics }) => {
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  
  const filteredProfiles = selectedSkill
    ? data.profiles.filter(p => p.skills.includes(selectedSkill))
    : data.profiles;

  const handleProfileClick = (profile: TalentProfile) => {
    onEvent?.({ type: 'profile_clicked', widget: 'talentverse_grid', data: { profile_id: profile.id } });
    analytics?.track({ event: 'talent_profile_clicked', profile_id: profile.id });
    if (profile.profileUrl) window.open(profile.profileUrl, '_blank');
  };

  return (
    <div className={`talentverse-grid-widget theme-${config.theme || 'light'}`}>
      {config.title && <h2 className="widget-title">{config.title}</h2>}
      
      {config.showFilters && data.skills && (
        <div className="filters">
          <button className={!selectedSkill ? 'active' : ''} onClick={() => setSelectedSkill('')}>All</button>
          {data.skills.map(skill => (
            <button 
              key={skill} 
              className={selectedSkill === skill ? 'active' : ''}
              onClick={() => setSelectedSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      )}
      
      <div className={`profiles-grid layout-${config.layout || 'grid'} columns-${config.columns || 3}`}>
        {filteredProfiles.map(profile => (
          <div key={profile.id} className="profile-card" onClick={() => handleProfileClick(profile)}>
            <div className="profile-header">
              {profile.avatar && <img src={profile.avatar} alt={profile.name} className="profile-avatar" />}
              <div className={`availability-badge ${profile.availability}`}></div>
            </div>
            <h3 className="profile-name">{profile.name}</h3>
            <p className="profile-role">{profile.role}</p>
            {profile.rating && (
              <div className="profile-rating">
                {'⭐'.repeat(Math.floor(profile.rating))} {profile.rating}
              </div>
            )}
            <div className="profile-skills">
              {profile.skills.slice(0, 3).map(skill => (
                <span key={skill} className="skill-tag">{skill}</span>
              ))}
            </div>
            {profile.hourlyRate && <div className="profile-rate">{profile.hourlyRate}/hr</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TalentverseGrid;

