const mongoose = require('mongoose');

const chaussureSchema = new mongoose.Schema({
  nom:           { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  prix:          { type: Number, required: true, min: 0 },
  categorie:     { type: String, default: 'Unisexe' },
  tailles:       { type: [String], default: [] },
  stock:         { type: Number, default: 0, min: 0 },
  photos:        { type: [String], default: [] },       // URLs Cloudinary
  cloudinaryIds: { type: [String], default: [] },       // public_id pour suppression
  dateAjout:     { type: Date, default: Date.now },
});

// Index texte pour la recherche
chaussureSchema.index({ nom: 'text', description: 'text' });

module.exports = mongoose.model('Chaussure', chaussureSchema);
