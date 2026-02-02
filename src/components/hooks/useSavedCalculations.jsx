import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export function useSavedCalculations() {
  const { data: calculations = [], isLoading, refetch } = useQuery({
    queryKey: ['savedCalculations'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getUserCalculations', {});
        return response.data || [];
      } catch (error) {
        console.error('Error loading calculations:', error);
        return [];
      }
    }
  });

  const saveCalculation = async (data) => {
    try {
      const response = await base44.functions.invoke('saveCalculation', {
        name: data.name,
        calculator_type: data.calculator_type,
        inputs: data.inputs,
        results: data.results,
        description: data.description
      });
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }
  };

  const updateCalculation = async (id, data) => {
    try {
      const response = await base44.functions.invoke('updateCalculation', {
        calculation_id: id,
        ...data
      });
      await refetch();
      return response.data;
    } catch (error) {
      console.error('Error updating calculation:', error);
      throw error;
    }
  };

  const deleteCalculation = async (id) => {
    try {
      await base44.functions.invoke('deleteCalculation', {
        calculation_id: id
      });
      await refetch();
    } catch (error) {
      console.error('Error deleting calculation:', error);
      throw error;
    }
  };

  const shareCalculation = async (id, shared_with_email, access_level = 'view') => {
    try {
      const calc = calculations.find(c => c.id === id);
      if (!calc) throw new Error('Calculation not found');

      const response = await base44.functions.invoke('shareDocument', {
        document_id: id,
        shared_with_email,
        access_level,
        document_title: calc.name
      });
      return response.data;
    } catch (error) {
      console.error('Error sharing calculation:', error);
      throw error;
    }
  };

  return {
    calculations,
    isLoading,
    saveCalculation,
    updateCalculation,
    deleteCalculation,
    shareCalculation,
    refetch
  };
}