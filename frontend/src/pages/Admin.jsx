import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
// se elimina filterByAdminScope agregado por PR #29

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

  // Restauramos filtros visuales globales sin scoped variables

  const filteredOffers = offers.filter((o) => {
    const matchStatus = offerStatus === 'all' || o.status === offerStatus;
    const q = offerQ.trim().toLowerCase();
    const matchQ =
      !q ||
      (o.title || '').toLowerCase().includes(q) ||
      (o.category || '').toLowerCase().includes(q) ||
      (o.city || '').toLowerCase().includes(q) ||
      (o.department || '').toLowerCase().includes(q);
    return matchStatus && matchQ;
  });

  const filteredUsers = users.filter((u) => {
    const q = userQ.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.department || '').toLowerCase().includes(q) ||
      (u.city || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
  });

  // ... resto del componente
};

export default Admin;