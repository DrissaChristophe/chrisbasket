const mongoose = require('mongoose');

const chaussureSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  prix: {
    type: Number,
    required: [true, 'Le prix est obligatoire'],
    min: 0
  },
  categorie: {
    type: String,
    default: 'Unisexe'
  },
  tailles: {
    type: [String],
    default: []
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  photos: {
    type: [String],   // tableau de chemins (max 3)
    default: []
  },
  dateAjout: {
    type: Date,
    default: Date.now
  }
});

// Index texte pour la recherche
chaussureSchema.index({ nom: 'text', description: 'text', categorie: 'text' });

module.exports = mongoose.model('Chaussure', chaussureSchema);
