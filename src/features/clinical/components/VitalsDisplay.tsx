import React from 'react';
import { Vitals } from '../../../core/models';
import { Activity, Heart, Thermometer, Weight, Ruler, Wind } from 'lucide-react';

interface VitalsDisplayProps {
  vitals?: Vitals;
}

export const VitalsDisplay: React.FC<VitalsDisplayProps> = ({ vitals }) => {
  if (!vitals || Object.keys(vitals).length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="mx-auto text-slate-300 mb-2" size={40} />
        <p className="text-slate-500 text-sm">No vitals recorded</p>
      </div>
    );
  }

  const vitalItems = [
    {
      label: 'Blood Pressure',
      value: vitals.bloodPressure,
      unit: 'mmHg',
      icon: Heart,
      color: 'text-red-600',
      bg: 'bg-red-50'
    },
    {
      label: 'Pulse',
      value: vitals.pulse,
      unit: 'bpm',
      icon: Activity,
      color: 'text-pink-600',
      bg: 'bg-pink-50'
    },
    {
      label: 'Temperature',
      value: vitals.temperature,
      unit: '°F',
      icon: Thermometer,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      label: 'Weight',
      value: vitals.weight,
      unit: 'kg',
      icon: Weight,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      label: 'Height',
      value: vitals.height,
      unit: 'cm',
      icon: Ruler,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      label: 'Respiratory Rate',
      value: vitals.respiratoryRate,
      unit: '/min',
      icon: Wind,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50'
    },
    {
      label: 'O₂ Saturation',
      value: vitals.oxygenSaturation,
      unit: '%',
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {vitalItems.map((item) => {
        if (!item.value) return null;
        
        const Icon = item.icon;
        
        return (
          <div key={item.label} className={`${item.bg} rounded-lg p-4 border border-slate-200`}>
            <div className="flex items-center mb-2">
              <Icon className={`${item.color} mr-2`} size={18} />
              <span className="text-xs text-slate-600">{item.label}</span>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-slate-800">{item.value}</span>
              <span className="text-sm text-slate-600 ml-1">{item.unit}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};