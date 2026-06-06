import { DEPARTMENTS, citiesOf, VALID_CATEGORIES } from '../config/colombia.js';

export function getDepartments() {
  return DEPARTMENTS;
}

export function getCities(department) {
  if (!department) return [];
  return citiesOf(department);
}

export function getCategories() {
  return VALID_CATEGORIES;
}
