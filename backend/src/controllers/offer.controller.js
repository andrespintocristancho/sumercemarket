import * as offerService from '../services/offer.service.js';

export async function createOffer(req, res, next) {
  try {
    const offer = offerService.createOffer(req.user, req.body, req.files);
    res.status(201).json(offer);
  } catch (e) { next(e); }
}

export async function listOffers(req, res, next) {
  try {
    const data = offerService.listOffers(req.query);
    res.json(data);
  } catch (e) { next(e); }
}

export async function getOffer(req, res, next) {
  try {
    const offer = offerService.getOfferById(Number(req.params.id));
    res.json(offer);
  } catch (e) { next(e); }
}

export async function myOffers(req, res, next) {
  try {
    const items = offerService.listMyOffers(req.user.id);
    res.json({ items });
  } catch (e) { next(e); }
}

export async function updateOffer(req, res, next) {
  try {
    const offer = offerService.updateOffer(req.user, Number(req.params.id), req.body);
    res.json(offer);
  } catch (e) { next(e); }
}

export async function deleteOffer(req, res, next) {
  try {
    const out = offerService.deleteOffer(req.user, Number(req.params.id));
    res.json(out);
  } catch (e) { next(e); }
}

export async function registerContact(req, res, next) {
  try {
    const out = offerService.registerContact(Number(req.params.id));
    res.json(out);
  } catch (e) { next(e); }
}
