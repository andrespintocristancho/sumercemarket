import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
// se elimina applyAdminScopeToQuery agregado por PR #32

// ... resto de imports existentes

const Admin = () => {
  // ... código previo

  useEffect(() => {
    const fetchData = async () => {
      const [offersListRes, usersListRes, statsRes] = await Promise.all([
        supabase
          .from('offers')
          .select('id, title, category, price, city, department, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(500),
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