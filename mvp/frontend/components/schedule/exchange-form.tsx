'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, MapPin, Clock, Package, FileText, Repeat } from 'lucide-react';
import {
  exchangesAPI,
  casesAPI,
  CreateCustodyExchangeRequest,
  ExchangeType,
  RecurrencePattern,
  Child,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ExchangeFormProps {
  caseId: string;
  onClose: () => void;
  onSuccess?: () => void;
  initialDate?: Date;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function ExchangeForm({
  caseId,
  onClose,
  onSuccess,
  initialDate,
}: ExchangeFormProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    exchange_type: 'dropoff' as ExchangeType,
    title: '',
    location: '',
    location_notes: '',
    scheduled_time: initialDate ? formatDateTime(initialDate) : '',
    duration_minutes: 15,
    child_ids: [] as string[],
    is_recurring: false,
    recurrence_pattern: 'weekly' as RecurrencePattern,
    recurrence_days: [] as number[],
    recurrence_end_date: '',
    items_to_bring: '',
    special_instructions: '',
    notes_visible_to_coparent: true,
  });

  useEffect(() => {
    loadInitialData();
  }, [caseId]);

  const loadInitialData = async () => {
    try {
      const caseData = await casesAPI.get(caseId);
      setChildren(caseData.children || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Generate title if not provided
      let title = formData.title;
      if (!title) {
        const typeLabels: Record<ExchangeType, string> = {
          pickup: 'Pickup',
          dropoff: 'Dropoff',
          both: 'Exchange',
        };
        title = typeLabels[formData.exchange_type];
        if (formData.is_recurring) {
          title += ' (Recurring)';
        }
      }

      const exchangeData: CreateCustodyExchangeRequest = {
        case_id: caseId,
        exchange_type: formData.exchange_type,
        title,
        location: formData.location || undefined,
        location_notes: formData.location_notes || undefined,
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
        duration_minutes: formData.duration_minutes,
        child_ids: formData.child_ids,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : undefined,
        recurrence_days: formData.is_recurring && formData.recurrence_days.length > 0
          ? formData.recurrence_days
          : undefined,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date
          ? new Date(formData.recurrence_end_date).toISOString()
          : undefined,
        items_to_bring: formData.items_to_bring || undefined,
        special_instructions: formData.special_instructions || undefined,
        notes_visible_to_coparent: formData.notes_visible_to_coparent,
      };

      await exchangesAPI.create(exchangeData);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create exchange');
      console.error('Error creating exchange:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChild = (childId: string) => {
    setFormData(prev => ({
      ...prev,
      child_ids: prev.child_ids.includes(childId)
        ? prev.child_ids.filter(id => id !== childId)
        : [...prev.child_ids, childId],
    }));
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days.includes(day)
        ? prev.recurrence_days.filter(d => d !== day)
        : [...prev.recurrence_days, day].sort(),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-bold">Schedule Pickup/Dropoff</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Exchange Type */}
            <div>
              <Label>Exchange Type *</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[
                  { value: 'pickup', label: 'Pickup', desc: 'Receiving child' },
                  { value: 'dropoff', label: 'Dropoff', desc: 'Transferring child' },
                  { value: 'both', label: 'Both', desc: 'Pick up & Drop off' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, exchange_type: type.value as ExchangeType })}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      formData.exchange_type === type.value
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-gray-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title (optional) */}
            <div>
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Friday Evening Exchange"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank for auto-generated title</p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduled_time">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Date & Time *
                </Label>
                <Input
                  id="scheduled_time"
                  type="datetime-local"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="5"
                  max="120"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 15 })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">
                <MapPin className="inline h-4 w-4 mr-1" />
                Location
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., School parking lot, Police station"
                className="mt-1"
              />
              <textarea
                id="location_notes"
                value={formData.location_notes}
                onChange={(e) => setFormData({ ...formData, location_notes: e.target.value })}
                placeholder="Additional location notes..."
                rows={2}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            {/* Recurring */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_recurring" className="cursor-pointer flex items-center gap-1">
                  <Repeat className="h-4 w-4" />
                  Make this a recurring exchange
                </Label>
              </div>

              {formData.is_recurring && (
                <div className="mt-4 space-y-4 pl-6 border-l-2 border-purple-200">
                  {/* Recurrence Pattern */}
                  <div>
                    <Label htmlFor="recurrence_pattern">Repeat</Label>
                    <select
                      id="recurrence_pattern"
                      value={formData.recurrence_pattern}
                      onChange={(e) => setFormData({
                        ...formData,
                        recurrence_pattern: e.target.value as RecurrencePattern
                      })}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Every 2 weeks</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom days</option>
                    </select>
                  </div>

                  {/* Days of Week (for weekly/custom) */}
                  {(formData.recurrence_pattern === 'weekly' || formData.recurrence_pattern === 'custom') && (
                    <div>
                      <Label>On these days</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              formData.recurrence_days.includes(day.value)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* End Date */}
                  <div>
                    <Label htmlFor="recurrence_end_date">End Date (optional)</Label>
                    <Input
                      id="recurrence_end_date"
                      type="date"
                      value={formData.recurrence_end_date}
                      onChange={(e) => setFormData({ ...formData, recurrence_end_date: e.target.value })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank for no end date</p>
                  </div>
                </div>
              )}
            </div>

            {/* Children */}
            {children.length > 0 && (
              <div>
                <Label>Children Involved</Label>
                <div className="mt-2 space-y-2">
                  {children.map((child) => (
                    <div key={child.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`child_${child.id}`}
                        checked={formData.child_ids.includes(child.id)}
                        onChange={() => toggleChild(child.id)}
                        className="rounded"
                      />
                      <Label htmlFor={`child_${child.id}`} className="cursor-pointer">
                        {child.first_name} {child.last_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items to Bring */}
            <div>
              <Label htmlFor="items_to_bring">
                <Package className="inline h-4 w-4 mr-1" />
                Items to Bring/Transfer
              </Label>
              <Input
                id="items_to_bring"
                value={formData.items_to_bring}
                onChange={(e) => setFormData({ ...formData, items_to_bring: e.target.value })}
                placeholder="e.g., School backpack, medications, favorite toy"
                className="mt-1"
              />
            </div>

            {/* Special Instructions */}
            <div>
              <Label htmlFor="special_instructions">
                <FileText className="inline h-4 w-4 mr-1" />
                Special Instructions
              </Label>
              <textarea
                id="special_instructions"
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                placeholder="Any specific instructions for this exchange..."
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="notes_visible"
                  checked={formData.notes_visible_to_coparent}
                  onChange={(e) => setFormData({ ...formData, notes_visible_to_coparent: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="notes_visible" className="cursor-pointer text-sm">
                  Share notes with co-parent
                </Label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="sm:flex-shrink-0"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? 'Creating...' : formData.is_recurring ? 'Create Recurring Exchange' : 'Create Exchange'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
