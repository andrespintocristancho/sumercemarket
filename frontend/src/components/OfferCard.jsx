import { Link } from 'react-router-dom';
import { formatCOP, getCategory } from '../utils/categories.js';
import './OfferCard.css';

export default function OfferCard({ offer }) {
  const cat = getCategory(offer.category);
  const cover = offer.images && offer.images.length > 0 ? offer.images[0].url : null;

  return (
    <Link to={`/offer/${offer.id}`} className="offer-card card">
      <div className="offer-card-image">
        {cover ? (
          <img src={cover} alt={offer.title} loading="lazy" />
        ) : (
          <div className="offer-card-placeholder">
            <span>{cat.icon}</span>
          </div>
        )}
        <span className="offer-card-category">{cat.icon} {cat.label}</span>
        {offer.status === 'sold' && <span className="offer-card-sold">VENDIDO</span>}
      </div>
      <div className="offer-card-body">
        <h3 className="offer-card-title">{offer.title}</h3>
        <p className="offer-card-price">{formatCOP(offer.price)}</p>
        <p className="offer-card-location">📍 {offer.city}, {offer.department}</p>
      </div>
    </Link>
  );
}
