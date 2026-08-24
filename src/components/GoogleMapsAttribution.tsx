import React from 'react';
import { ExternalLink, MapPin } from 'lucide-react';

export interface GroundingMapsChunk {
  title?: string;
  uri?: string;
  placeId?: string;
}

export interface GroundingChunk {
  maps?: GroundingMapsChunk;
}

export interface GoogleMapsAttributionProps {
  /**
   * Grounding chunks returned from Firebase AI Logic / Gemini API with Google Maps tool
   */
  groundingChunks?: GroundingChunk[];
  /**
   * Additional wrapper CSS classes
   */
  className?: string;
  /**
   * Whether to show Google Maps favicon alongside the text attribution
   */
  showFavicon?: boolean;
}

export const GoogleMapsAttribution: React.FC<GoogleMapsAttributionProps> = ({
  groundingChunks = [],
  className = '',
  showFavicon = true,
}) => {
  const validChunks = groundingChunks.filter((chunk) => Boolean(chunk.maps?.uri));

  if (validChunks.length === 0) {
    return null;
  }

  return (
    <div className={`border-t border-slate-200 pt-3.5 mt-4 space-y-3 ${className}`}>
      {/* Header Attribution Line according to Google Maps Grounding Guidelines */}
      <div className="flex items-center gap-2 text-xs text-slate-600">
        {showFavicon ? (
          <img
            src="https://www.google.com/images/branding/product/ico/web_maps_icon_32dp.ico"
            alt="Google Maps"
            className="w-4 h-4 object-contain flex-shrink-0"
            translate="no"
          />
        ) : (
          <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            translate="no"
            className="GMP-attribution inline-block"
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontWeight: 400,
              fontSize: '0.875rem',
              color: '#5e5e5e',
            }}
          >
            Google Maps
          </span>
          <span className="text-slate-500 font-medium">Grounded Sources:</span>
        </div>
      </div>

      {/* Grid of Source Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {validChunks.map((chunk, index) => {
          const item = chunk.maps!;
          const title = item.title || 'View location on Google Maps';

          return (
            <a
              key={item.placeId || index}
              href={item.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 rounded-xl text-xs font-semibold text-slate-800 transition-all shadow-sm group"
            >
              <span className="truncate group-hover:text-indigo-700">{title}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
            </a>
          );
        })}
      </div>
    </div>
  );
};
