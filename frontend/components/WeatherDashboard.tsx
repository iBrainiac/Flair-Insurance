'use client'

import { useState, useEffect } from 'react'
import { Cloud, Thermometer, Droplets, Wind } from 'lucide-react'

interface WeatherData {
  location: string
  temperature: number
  humidity: number
  rainfall: number
  windSpeed: number
  lastUpdated: string
}

export default function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([
    {
      location: 'Kenya - Nairobi Region',
      temperature: 24,
      humidity: 65,
      rainfall: 2.5,
      windSpeed: 12,
      lastUpdated: '2 minutes ago'
    },
    {
      location: 'India - Punjab',
      temperature: 32,
      humidity: 45,
      rainfall: 0.0,
      windSpeed: 8,
      lastUpdated: '5 minutes ago'
    },
    {
      location: 'Brazil - São Paulo',
      temperature: 28,
      humidity: 78,
      rainfall: 15.2,
      windSpeed: 15,
      lastUpdated: '1 minute ago'
    }
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Live Weather Data</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>FDC Verified Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {weatherData.map((data, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{data.location}</h3>
              <Cloud className="h-5 w-5 text-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-gray-500">Temperature</p>
                  <p className="font-semibold">{data.temperature}°C</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Rainfall</p>
                  <p className="font-semibold">{data.rainfall}mm</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Wind className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray