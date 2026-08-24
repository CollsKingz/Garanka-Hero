import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Incident, IncidentCategory } from '../../types';
import { Flame, MapPin, AlertTriangle, Filter, Calendar, Info, ShieldAlert } from 'lucide-react';

interface IncidentHeatmapD3Props {
  incidents: Incident[];
}

// Predefined list of typical location zones if incidents don't cover all
const DEFAULT_LOCATIONS = [
  'Main Gate North',
  'Perimeter Wall West',
  'Block A - Residential',
  'Block B - Community',
  'Visitor Parking A',
  'Commercial Hub',
  'Substation & Armory',
];

const CATEGORY_LABELS: Record<string, string> = {
  PANIC_GENERAL: 'Panic Alarm (General)',
  ARMED_ROBBERY: 'Armed Robbery / Intruder',
  MEDICAL_EMERGENCY: 'Medical Distress',
  FIRE_HAZARD: 'Fire & Smoke Hazard',
  ASSAULT: 'Physical Assault',
  SUSPICIOUS_PERSON: 'Suspicious Activity',
  UNAUTHORIZED_ENTRY: 'Unauthorized Breach',
  VEHICLE_THEFT: 'Vehicle Theft / Tampering',
};

const ALL_CATEGORIES: IncidentCategory[] = [
  'PANIC_GENERAL',
  'ARMED_ROBBERY',
  'UNAUTHORIZED_ENTRY',
  'SUSPICIOUS_PERSON',
  'MEDICAL_EMERGENCY',
  'FIRE_HAZARD',
  'VEHICLE_THEFT',
  'ASSAULT',
];

interface HeatmapMatrixItem {
  category: string;
  location: string;
  value: number;
}

export const IncidentHeatmapD3: React.FC<IncidentHeatmapD3Props> = ({ incidents }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'matrix' | 'time'>('matrix'); // matrix: Category vs Location, time: Day vs Category
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    subtitle: string;
    count: number;
    details: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    title: '',
    subtitle: '',
    count: 0,
    details: '',
  });

  // Filter incidents based on selected month and severity
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // Month check
      const incDate = inc.createdAt ? new Date(inc.createdAt) : new Date();
      const incMonthStr = `${incDate.getFullYear()}-${String(incDate.getMonth() + 1).padStart(2, '0')}`;
      if (selectedMonth !== 'all' && incMonthStr !== selectedMonth) return false;

      // Severity check
      if (selectedSeverity !== 'all' && inc.severity !== selectedSeverity) return false;

      return true;
    });
  }, [incidents, selectedMonth, selectedSeverity]);

  // Extract unique location names or fallback to standard list
  const locationList = useMemo(() => {
    const locSet = new Set<string>();
    incidents.forEach((inc) => {
      const loc = inc.siteName || inc.houseNumber || inc.coordinates?.address || 'Main Perimeter';
      locSet.add(loc);
    });
    const customLocs = Array.from(locSet);
    if (customLocs.length < 4) {
      return Array.from(new Set([...customLocs, ...DEFAULT_LOCATIONS]));
    }
    return customLocs;
  }, [incidents]);

  // Process data matrix for Categories vs Locations
  const matrixData = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {};

    ALL_CATEGORIES.forEach((cat) => {
      counts[cat] = {};
      locationList.forEach((loc) => {
        counts[cat][loc] = 0;
      });
    });

    // Populate counts from filtered incidents
    filteredIncidents.forEach((inc) => {
      const cat = inc.category || 'PANIC_GENERAL';
      const loc = inc.siteName || inc.houseNumber || inc.coordinates?.address || locationList[0];
      
      if (!counts[cat]) {
        counts[cat] = {};
      }
      if (counts[cat][loc] === undefined) {
        counts[cat][loc] = 0;
      }
      counts[cat][loc] += 1;
    });

    // If data is scarce, create representative background distribution based on existing incidents
    // to give security officers actionable visual analytics
    let totalCount = 0;
    ALL_CATEGORIES.forEach((cat) => {
      locationList.forEach((loc) => {
        totalCount += counts[cat]?.[loc] || 0;
      });
    });

    // Flatten into array format for D3
    const result: HeatmapMatrixItem[] = [];
    ALL_CATEGORIES.forEach((cat) => {
      locationList.forEach((loc) => {
        const val = counts[cat]?.[loc] || 0;
        result.push({
          category: cat,
          location: loc,
          value: val,
        });
      });
    });

    return result;
  }, [filteredIncidents, locationList]);

  // Find peak risk area & category
  const analyticsSummary = useMemo(() => {
    let maxVal = -1;
    let peakLoc = 'N/A';
    let peakCat = 'N/A';

    const locTotals: Record<string, number> = {};
    const catTotals: Record<string, number> = {};

    matrixData.forEach((d) => {
      locTotals[d.location] = (locTotals[d.location] || 0) + d.value;
      catTotals[d.category] = (catTotals[d.category] || 0) + d.value;

      if (d.value > maxVal) {
        maxVal = d.value;
        peakLoc = d.location;
        peakCat = CATEGORY_LABELS[d.category] || d.category;
      }
    });

    let topLoc = 'N/A';
    let topLocCount = -1;
    Object.entries(locTotals).forEach(([loc, cnt]) => {
      if (cnt > topLocCount) {
        topLocCount = cnt;
        topLoc = loc;
      }
    });

    let topCat = 'N/A';
    let topCatCount = -1;
    Object.entries(catTotals).forEach(([cat, cnt]) => {
      if (cnt > topCatCount) {
        topCatCount = cnt;
        topCat = CATEGORY_LABELS[cat] || cat;
      }
    });

    return {
      totalCount: filteredIncidents.length,
      peakLocation: topLoc,
      peakLocationCount: topLocCount,
      primaryHazard: topCat,
      primaryHazardCount: topCatCount,
      hotspotCell: maxVal > 0 ? `${peakLoc} (${peakCat}: ${maxVal})` : 'No Hotspots Identified',
    };
  }, [matrixData, filteredIncidents]);

  // Render D3 Heatmap Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 70, right: 30, bottom: 90, left: 180 };
    const width = Math.max(containerWidth - margin.left - margin.right, 300);
    const height = Math.max(ALL_CATEGORIES.length * 38, 280);

    // Clear previous SVG contents
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Locations)
    const xScale = d3
      .scaleBand()
      .range([0, width])
      .domain(locationList)
      .padding(0.08);

    // Y Scale (Categories)
    const yScale = d3
      .scaleBand()
      .range([0, height])
      .domain(ALL_CATEGORIES)
      .padding(0.08);

    // Color Scale: Yellow-Orange-Red D3 interpolator
    const maxValue = d3.max(matrixData, (d: HeatmapMatrixItem) => d.value) || 1;
    const colorScale = d3
      .scaleSequential()
      .interpolator(d3.interpolateYlOrRd)
      .domain([0, Math.max(maxValue, 3)]);

    // Draw X Axis (Locations)
    svg
      .append('g')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('color', '#475569')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .select('.domain')
      .remove();

    // Rotate X Axis labels for clean readability
    svg
      .selectAll('g.tick text')
      .attr('transform', 'translate(-10,10) rotate(-35)')
      .style('text-anchor', 'end')
      .style('font-family', 'sans-serif');

    // Draw Y Axis (Incident Categories)
    svg
      .append('g')
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('color', '#1e293b')
      .call(
        d3.axisLeft(yScale).tickFormat((d) => CATEGORY_LABELS[d as string] || (d as string)).tickSize(0)
      )
      .select('.domain')
      .remove();

    // Draw Heatmap Rectangles
    const cells = svg
      .selectAll<SVGRectElement, HeatmapMatrixItem>('rect.heatmap-cell')
      .data(matrixData)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d: HeatmapMatrixItem) => xScale(d.location) || 0)
      .attr('y', (d: HeatmapMatrixItem) => yScale(d.category) || 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', (d: HeatmapMatrixItem) => (d.value === 0 ? '#f8fafc' : colorScale(d.value)))
      .style('stroke', (d: HeatmapMatrixItem) => (d.value === 0 ? '#e2e8f0' : '#f87171'))
      .style('stroke-width', (d: HeatmapMatrixItem) => (d.value === 0 ? 1 : 1.5))
      .style('cursor', 'pointer')
      .style('opacity', 0.9)
      .style('transition', 'all 0.2s ease');

    // Add cell value text overlay
    svg
      .selectAll<SVGTextElement, HeatmapMatrixItem>('text.cell-label')
      .data(matrixData)
      .enter()
      .append('text')
      .attr('class', 'cell-label')
      .attr('x', (d: HeatmapMatrixItem) => (xScale(d.location) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d: HeatmapMatrixItem) => (yScale(d.category) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('font-weight', '800')
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')
      .style('fill', (d: HeatmapMatrixItem) => (d.value > maxValue * 0.6 ? '#ffffff' : d.value > 0 ? '#991b1b' : '#cbd5e1'))
      .text((d: HeatmapMatrixItem) => (d.value > 0 ? d.value : '0'));

    // Mouse Interaction (Hover Effects & Tooltip)
    cells
      .on('mouseover', function (event: MouseEvent, d: HeatmapMatrixItem) {
        d3.select(this)
          .style('stroke', '#b91c1c')
          .style('stroke-width', 3)
          .style('opacity', 1);

        const rect = containerRef.current?.getBoundingClientRect();
        const mouseX = event.clientX - (rect?.left || 0);
        const mouseY = event.clientY - (rect?.top || 0);

        setTooltip({
          visible: true,
          x: mouseX,
          y: mouseY - 10,
          title: CATEGORY_LABELS[d.category] || d.category,
          subtitle: `Location: ${d.location}`,
          count: d.value,
          details:
            d.value > 0
              ? `${d.value} incidents recorded. High priority patrol recommendation.`
              : 'Zero incidents recorded in this zone during selected period.',
        });
      })
      .on('mouseout', function (_event: MouseEvent, d: HeatmapMatrixItem) {
        d3.select(this)
          .style('stroke', d.value === 0 ? '#e2e8f0' : '#f87171')
          .style('stroke-width', d.value === 0 ? 1 : 1.5)
          .style('opacity', 0.9);

        setTooltip((prev) => ({ ...prev, visible: false }));
      });

    // Chart Title & Legend
    const legendG = svg
      .append('g')
      .attr('transform', `translate(0, ${-margin.top + 20})`);

    legendG
      .append('text')
      .attr('x', 0)
      .attr('y', 0)
      .style('font-size', '13px')
      .style('font-weight', '800')
      .style('fill', '#0f172a')
      .text('INCIDENT DENSITY HEATMAP MATRIX (D3.JS)');

    // Color gradient legend
    const legendWidth = 140;
    const legendHeight = 10;
    const legendX = width - legendWidth;

    const defs = svg.append('defs');
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', 'heatmap-legend-gradient');

    linearGradient
      .selectAll('stop')
      .data(
        d3.ticks(0, 1, 5).map((t) => ({
          offset: `${t * 100}%`,
          color: d3.interpolateYlOrRd(t),
        }))
      )
      .enter()
      .append('stop')
      .attr('offset', (d) => d.offset)
      .attr('stop-color', (d) => d.color);

    legendG
      .append('rect')
      .attr('x', legendX)
      .attr('y', -10)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('rx', 3)
      .style('fill', 'url(#heatmap-legend-gradient)');

    legendG
      .append('text')
      .attr('x', legendX - 35)
      .attr('y', -2)
      .style('font-size', '10px')
      .style('font-weight', '600')
      .style('fill', '#64748b')
      .text('Low');

    legendG
      .append('text')
      .attr('x', legendX + legendWidth + 8)
      .attr('y', -2)
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#b91c1c')
      .text('High');
  }, [matrixData, locationList, ALL_CATEGORIES]);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 text-left relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-red-50 border border-red-200 text-red-600">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Monthly Incident & Zone Heatmap Analytics
            </h2>
            <p className="text-xs text-slate-500">
              D3.js dynamic visual clustering by incident type, category, and spatial location
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="2026-08">August 2026 (Current)</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
              <option value="all">All Historical Months</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical Only</option>
              <option value="high">High & Critical</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards derived from D3 Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-red-50/60 border border-red-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-red-600 text-white rounded-xl">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
              Highest Risk Zone
            </div>
            <div className="text-sm font-black text-slate-900 truncate">
              {analyticsSummary.peakLocation}
            </div>
            <div className="text-[10px] font-semibold text-slate-600">
              {analyticsSummary.peakLocationCount} total incidents logged
            </div>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-amber-600 text-white rounded-xl">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Primary Hazard Type
            </div>
            <div className="text-sm font-black text-slate-900 truncate">
              {analyticsSummary.primaryHazard}
            </div>
            <div className="text-[10px] font-semibold text-slate-600">
              {analyticsSummary.primaryHazardCount} category alarms
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-xl">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Patrol Recommendation
            </div>
            <div className="text-xs font-bold text-slate-900 truncate">
              Focus Patrols on {analyticsSummary.peakLocation}
            </div>
            <div className="text-[10px] font-semibold text-slate-500">
              Increase Guard QR scans during shift transitions
            </div>
          </div>
        </div>
      </div>

      {/* D3 SVG Container */}
      <div ref={containerRef} className="w-full overflow-x-auto relative min-h-[360px] pt-2">
        <svg ref={svgRef} className="w-full max-w-full block"></svg>

        {/* Floating Interactive Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute z-30 bg-slate-900 text-white p-3 rounded-2xl shadow-xl pointer-events-none transition-all duration-75 border border-slate-700 max-w-xs text-xs space-y-1"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-bold text-red-400 text-xs">{tooltip.title}</div>
            <div className="text-[11px] text-slate-300 font-mono">{tooltip.subtitle}</div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-1.5 mt-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Total Incidents</span>
              <span className="font-mono font-black text-amber-400 text-sm">{tooltip.count}</span>
            </div>
            <p className="text-[10px] text-slate-300 italic pt-1">{tooltip.details}</p>
          </div>
        )}
      </div>
    </div>
  );
};
