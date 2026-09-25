import React, { useState } from 'react';
import { 
  Calendar, 
  Sun, 
  CloudRain, 
  Lock, 
  Unlock, 
  Plus, 
  RotateCw, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  MapPin, 
  ArrowRight, 
  Check, 
  X, 
  Car, 
  Compass, 
  Info,
  Layers,
  ArrowRightLeft,
  CalendarDays
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useTripStore } from '../store/tripStore';
import { ActivityItem, RainyDayAlternative } from '../types/models';
import { requestWetWeatherReplanning, regenerateDayActivities } from '../services/gemini';
import { formatCurrency, formatDate, formatDuration } from '../utils/format';

interface SortableActivityCardProps {
  activity: ActivityItem;
  dayIndex: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onMoveToDay: (targetDayIndex: number) => void;
  totalDays: number;
  currency: string;
}

const SortableActivityCard: React.FC<SortableActivityCardProps> = ({
  activity,
  dayIndex,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onToggleLock,
  onDelete,
  onMoveToDay,
  totalDays,
  currency,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: activity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const [showDayPicker, setShowDayPicker] = useState(false);

  const settingBadge = 
    activity.setting === 'indoor'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : activity.setting === 'outdoor'
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div 
        className={`bg-slate-900/90 border rounded-2xl p-4 transition-all duration-150 ${
          activity.locked 
            ? 'border-indigo-500/50 bg-indigo-950/15' 
            : 'border-slate-800 hover:border-slate-750'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          {/* Left: Drag Handle, Time & Details */}
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800 transition"
              title="Drag to reorder activity"
            >
              <div className="grid grid-cols-2 gap-0.5 w-3.5 h-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-current rounded-full" />
                ))}
              </div>
            </button>

            {/* Time Slot Badge */}
            <div className="flex flex-col items-center justify-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shrink-0 min-w-[62px]">
              <span className="font-mono text-xs font-bold text-white">
                {activity.startTime}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                {formatDuration(activity.durationMins)}
              </span>
            </div>

            {/* Activity Info */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  {activity.name}
                </h4>
                {/* Category chip */}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activity.category}
                </span>
                {/* Setting badge */}
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${settingBadge}`}>
                  {activity.setting}
                </span>
                {activity.needsTicket && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    Ticket Required
                  </span>
                )}
              </div>

              {activity.notes && (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activity.notes}
                </p>
              )}
            </div>
          </div>

          {/* Right: Cost & Controls */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            {/* Price */}
            <div className="text-right">
              <span className="font-mono text-xs font-bold text-white">
                {activity.estCost > 0 ? formatCurrency(activity.estCost, currency) : 'Free'}
              </span>
              {activity.estCost > 0 && (
                <span className="text-[10px] text-slate-400 block">/ person</span>
              )}
            </div>

            {/* Accessible Button Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg p-0.5">
              {/* Up */}
              <button
                type="button"
                onClick={onMoveUp}
                disabled={isFirst}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition"
                title="Move up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              {/* Down */}
              <button
                type="button"
                onClick={onMoveDown}
                disabled={isLast}
                className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700 transition"
                title="Move down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <div className="w-[1px] h-3 bg-slate-700" />

              {/* Lock Toggle */}
              <button
                type="button"
                onClick={onToggleLock}
                className={`p-1 rounded transition ${
                  activity.locked
                    ? 'text-indigo-400 bg-indigo-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={activity.locked ? 'Locked event (immune to wet-weather swaps and regeneration)' : 'Click to lock event'}
              >
                {activity.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>

              {/* Move to another day dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDayPicker(!showDayPicker)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition"
                  title="Move to another day"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                {showDayPicker && (
                  <div className="absolute right-0 top-7 w-32 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-xl z-30">
                    <span className="text-[10px] text-slate-400 px-2 py-1 block border-b border-slate-800">
                      Move to Day:
                    </span>
                    <div className="max-h-36 overflow-y-auto py-1">
                      {[...Array(totalDays)].map((_, i) => {
                        const targetIdx = i + 1;
                        if (targetIdx === dayIndex) return null;
                        return (
                          <button
                            key={targetIdx}
                            type="button"
                            onClick={() => {
                              onMoveToDay(targetIdx);
                              setShowDayPicker(false);
                            }}
                            className="w-full text-left px-2 py-1 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white rounded"
                          >
                            Day {targetIdx}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={onDelete}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                title="Delete activity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transit Time To Next Activity (Prompt 3 Requirement) */}
      {!isLast && (
        <div className="flex items-center gap-2 pl-6 py-1 text-[11px] text-slate-400 font-mono">
          <div className="w-4 h-[1px] bg-slate-800" />
          <Car className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>~{activity.transitTimeToNextMins || 15}m transit to next stop</span>
        </div>
      )}
    </div>
  );
};

export const Tab3Itinerary: React.FC = () => {
  const {
    itinerary,
    activeDayIndex,
    setActiveDayIndex,
    preferences,
    selectedDestination,
    updateActivity,
    addActivity,
    deleteActivity,
    moveActivity,
    reorderDayActivities,
    moveActivityToDay,
    toggleActivityLock,
    toggleWetWeatherDay,
    replaceDayActivities,
    setActiveTab,
    isLoading,
    setIsLoading,
    errorMessage,
    setErrorMessage,
  } = useTripStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSwapsModal, setShowSwapsModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customTime, setCustomTime] = useState('14:00');
  const [customDuration, setCustomDuration] = useState(90);
  const [customCost, setCustomCost] = useState(20);
  const [customCategory, setCustomCategory] = useState('Culture');
  const [customSetting, setCustomSetting] = useState<'indoor' | 'outdoor' | 'mixed'>('indoor');
  const [customNotes, setCustomNotes] = useState('');

  const currentDay = itinerary.find((d) => d.dayIndex === activeDayIndex) || itinerary[0];
  const activePlan = currentDay 
    ? (currentDay.mode === 'rainy' && currentDay.rainyPlan ? currentDay.rainyPlan : currentDay.sunnyPlan)
    : [];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !currentDay) return;

    const oldIndex = activePlan.findIndex((item) => item.id === active.id);
    const newIndex = activePlan.findIndex((item) => item.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(activePlan, oldIndex, newIndex);
      reorderDayActivities(activeDayIndex, reordered);
    }
  };

  // Pace Overload Warning Check (Prompt 3 requirement)
  const maxPaceCount = preferences.pace === 'relaxed' ? 3 : preferences.pace === 'balanced' ? 5 : 7;
  const isOverbooked = activePlan.length > maxPaceCount;

  // Wet-Weather Mode Toggle for current day
  const handleToggleWetWeather = async () => {
    if (!currentDay || !selectedDestination) return;

    if (currentDay.mode === 'rainy') {
      // Revert to original sunny plan cleanly
      toggleWetWeatherDay(activeDayIndex);
    } else {
      // If we already have rainy plan cached, toggle instantly
      if (currentDay.rainyPlan && currentDay.swaps && currentDay.swaps.length > 0) {
        toggleWetWeatherDay(activeDayIndex);
        setShowSwapsModal(true);
      } else {
        // Query AI for indoor replacements of outdoor unlocked activities
        setIsLoading(true, `Generating indoor wet-weather replacements for Day ${activeDayIndex}...`);
        setErrorMessage(null);
        try {
          const res = await requestWetWeatherReplanning(
            selectedDestination.city,
            selectedDestination.country,
            currentDay.sunnyPlan
          );
          if (res.data.swaps.length > 0) {
            toggleWetWeatherDay(activeDayIndex, res.data.swaps);
            setShowSwapsModal(true);
          } else {
            setErrorMessage('No outdoor flexible activities needed swapping on this day.');
          }
        } catch (err: any) {
          setErrorMessage(err?.message || 'Failed to generate wet weather alternatives.');
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  // Regenerate Day while preserving locked activities (Prompt 3 requirement)
  const handleRegenerateDay = async () => {
    if (!currentDay || !selectedDestination) return;
    const lockedActs = currentDay.sunnyPlan.filter((a) => a.locked);
    setIsLoading(true, `Regenerating open slots for Day ${activeDayIndex} (preserving ${lockedActs.length} locked events)...`);
    setErrorMessage(null);

    try {
      const res = await regenerateDayActivities(
        selectedDestination.city,
        selectedDestination.country,
        currentDay.date,
        preferences.vibes,
        preferences.pace,
        lockedActs
      );
      if (res.data.activities && res.data.activities.length > 0) {
        replaceDayActivities(activeDayIndex, res.data.activities);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to regenerate day activities.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newAct: ActivityItem = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      startTime: customTime,
      durationMins: Number(customDuration) || 60,
      estCost: Number(customCost) || 0,
      setting: customSetting,
      locked: false,
      needsTicket: false,
      notes: customNotes.trim() || undefined,
      transitTimeToNextMins: 15,
    };

    addActivity(activeDayIndex, newAct);
    setShowAddModal(false);
    setCustomName('');
    setCustomNotes('');
  };

  if (itinerary.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950">
        <CalendarDays className="w-12 h-12 text-slate-600 mb-3" />
        <h2 className="text-base font-bold text-white">No Itinerary Generated Yet</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">Please confirm your destination and flights to generate your schedule.</p>
        <button
          onClick={() => setActiveTab(2)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Go to Confirm Step
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* LEFT RAIL: Days Selector (Scrollable) */}
      <div className="w-full lg:w-80 lg:min-w-[280px] border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/50 p-3 sm:p-4 overflow-y-auto min-h-0 flex flex-col justify-between shrink-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Trip Days ({itinerary.length})
            </h3>
            <span className="text-[10px] text-indigo-400 font-mono">
              {preferences.pace} pace
            </span>
          </div>

          {/* Days List */}
          <div className="space-y-1.5">
            {itinerary.map((day) => {
              const isSelected = day.dayIndex === activeDayIndex;
              const hasHighRain = (day.rainChance || 0) >= 60;
              const isRainyMode = day.mode === 'rainy';

              return (
                <button
                  key={day.dayIndex}
                  type="button"
                  onClick={() => setActiveDayIndex(day.dayIndex)}
                  className={`w-full p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500/40 text-white shadow-sm'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold">
                        Day {day.dayIndex}
                      </span>
                      {isRainyMode && (
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          Wet Weather Mode
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatDate(day.date)}
                    </div>
                  </div>

                  {/* Weather Icon & Rain Badge */}
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1 font-mono text-xs">
                      {hasHighRain ? (
                        <CloudRain className="w-4 h-4 text-sky-400" />
                      ) : (
                        <Sun className="w-4 h-4 text-amber-400" />
                      )}
                      <span>{day.temperatureC || 21}°C</span>
                    </div>

                    {hasHighRain && !isRainyMode && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                        Rain likely ({day.rainChance}%)
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue to Logistics CTA */}
        <div className="pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab(4)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Bookings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* RIGHT: Selected Day Timeline & Wet-Weather Mode Toggle (Scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-slate-950">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Day Header Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  Day {currentDay.dayIndex} of {itinerary.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {formatDate(currentDay.date, { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-1 flex items-center gap-2">
                <span>{currentDay.weatherSummary || 'Clear skies & mild'}</span>
              </h2>
            </div>

            {/* Controls: Wet-Weather Toggle & Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Wet Weather Mode Button */}
              <button
                type="button"
                onClick={handleToggleWetWeather}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition shadow-sm ${
                  currentDay.mode === 'rainy'
                    ? 'bg-sky-500/25 border-sky-400/50 text-sky-200 shadow-sky-500/20'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Toggles indoor wet-weather replacements for outdoor activities. Fully reversible!"
              >
                {currentDay.mode === 'rainy' ? (
                  <>
                    <CloudRain className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span>Wet-Weather Plan Active</span>
                    <span className="text-[10px] text-sky-300 underline ml-1" onClick={(e) => { e.stopPropagation(); setShowSwapsModal(true); }}>
                      (view changes)
                    </span>
                  </>
                ) : (
                  <>
                    <CloudRain className="w-4 h-4 text-slate-400" />
                    <span>Switch to Wet-Weather Plan</span>
                  </>
                )}
              </button>

              {/* Regenerate Day (Preserves Locked Events) */}
              <button
                type="button"
                onClick={handleRegenerateDay}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 border border-slate-750 text-slate-300 hover:text-white flex items-center gap-1.5 transition"
                title="Regenerates open slots while strictly preserving locked events"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Regenerate Day</span>
              </button>

              {/* Add Custom Activity */}
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stop</span>
              </button>
            </div>
          </div>

          {/* Overbooked Pace Warning (Prompt 3 Requirement) */}
          {isOverbooked && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-200 animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Pace Warning:</strong> This day has {activePlan.length} stops, which exceeds your chosen <em>{preferences.pace}</em> pace guideline ({maxPaceCount} max). Consider removing or moving an activity.
                </span>
              </div>
            </div>
          )}

          {/* Error Message Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Timeline of Activities with Drag & Drop */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={activePlan.map((a) => a.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {activePlan.map((activity, idx) => (
                  <SortableActivityCard
                    key={activity.id}
                    activity={activity}
                    dayIndex={currentDay.dayIndex}
                    isFirst={idx === 0}
                    isLast={idx === activePlan.length - 1}
                    onMoveUp={() => moveActivity(currentDay.dayIndex, activity.id, 'up')}
                    onMoveDown={() => moveActivity(currentDay.dayIndex, activity.id, 'down')}
                    onToggleLock={() => toggleActivityLock(currentDay.dayIndex, activity.id)}
                    onDelete={() => deleteActivity(currentDay.dayIndex, activity.id)}
                    onMoveToDay={(target) => moveActivityToDay(currentDay.dayIndex, target, activity.id)}
                    totalDays={itinerary.length}
                    currency={preferences.currency}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* MODAL: What Changed in Wet-Weather Mode */}
      {showSwapsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Wet-Weather Adaptations (Day {currentDay.dayIndex})</h3>
              </div>
              <button
                onClick={() => setShowSwapsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Outdoor unlocked activities have been replaced with authentic sheltered indoor alternatives. Locked activities and times were preserved.
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(currentDay.swaps || []).map((swap, idx) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-750 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="line-through text-slate-500">Outdoor original</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Indoor replacement
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {swap.replacement.name}
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    "{swap.reason}"
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                You can toggle back to the original sunny plan anytime without losing edits.
              </span>
              <button
                onClick={() => setShowSwapsModal(false)}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Custom Activity */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form 
            onSubmit={handleCreateCustomActivity} 
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add Custom Activity to Day {currentDay.dayIndex}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Traditional Tea House Ceremony"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={customTime}
                    onChange={(e) => setCustomTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Estimated Cost ({preferences.currency})</label>
                  <input
                    type="number"
                    min="0"
                    value={customCost}
                    onChange={(e) => setCustomCost(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                  >
                    {['Culture', 'Food', 'Nature', 'Nightlife', 'Shopping', 'Adventure', 'Logistics'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Setting</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['indoor', 'outdoor', 'mixed'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCustomSetting(s)}
                      className={`py-1.5 text-xs font-semibold rounded-lg capitalize border ${
                        customSetting === s
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Recommended attire or booking tips"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500"
              >
                Add Activity
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
