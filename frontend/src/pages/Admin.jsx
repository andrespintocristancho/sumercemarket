import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { applyAdminScopeToQuery } from '../lib/adminScope';

// ... resto de imports existentes

const Admin = () => {
  // ... código previo

  useEffect(() => {
    const fetchData = async () => {
      let offersQuery = supabase
        .from('offers')
        .select('id, title, category, price, city, department, status, created_at, user_id');

      offersQuery = applyAdminScopeToQuery(offersQuery, profile);
      offersQuery = offersQuery.order('created_at', { ascending: false }).limit(500);

      const [offersListRes, usersListRes, statsRes] = await Promise.all([
        offersQuery,
        supabase.from('users').select('*'),
        supabase.rpc('get_admin_stats'),
      ]);

      // ... resto del código sin cambios
    };

    fetchData();
  }, [profile]);

  // ... resto del componente
};

export default Admin;