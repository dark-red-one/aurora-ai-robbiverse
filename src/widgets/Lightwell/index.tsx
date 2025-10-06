import React, { useState } from 'react';
import { WidgetProps } from '../types';
import './Lightwell.css';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  description?: string;
  alt?: string;
}

export interface LightwellConfig {
  id: string;
  layout?: 'grid' | 'masonry' | 'carousel';
  columns?: number;
  gap?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
  showTitles?: boolean;
  enableLightbox?: boolean;
}

export interface LightwellData {
  items: MediaItem[];
}

interface LightwellProps extends WidgetProps {
  config: LightwellConfig;
  data: LightwellData;
}

export const Lightwell: React.FC<LightwellProps> = ({ config, data, analytics }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => {
    if (config.enableLightbox) {
      setLightboxIndex(index);
      analytics?.track({ event: 'lightwell_item_opened', item_id: data.items[index].id });
    }
  };

  return (
    <div className={`lightwell-widget theme-${config.theme || 'light'} layout-${config.layout || 'grid'}`}>
      <div className={`media-grid columns-${config.columns || 3} gap-${config.gap || 'medium'}`}>
        {data.items.map((item, index) => (
          <div key={item.id} className="media-item" onClick={() => openLightbox(index)}>
            <img src={item.thumbnail || item.url} alt={item.alt || item.title} />
            {config.showTitles && item.title && <div className="media-title">{item.title}</div>}
          </div>
        ))}
      </div>
      {lightboxIndex !== null && (
        <div className="lightbox" onClick={() => setLightboxIndex(null)}>
          <img src={data.items[lightboxIndex].url} alt={data.items[lightboxIndex].alt} />
        </div>
      )}
    </div>
  );
};

export default Lightwell;

