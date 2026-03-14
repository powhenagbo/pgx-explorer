const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/PGxDatabase');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const minorityInfoSchema = new mongoose.Schema({
  Drug: String,
  SNP: String,
  Biomarker: String,
  Chr: String,
  Pos: String,
  Ref: String,
  Alt: String,
  'African(AF)': Number,
  'African American(AF)': Number,
  'European(AF)': Number,
  'Latin American(AF)': Number,
  'Other(AF)': Number,
  'South Asian(AF)': Number,
  'Total(AF)': Number,
  'Therapeutic Area': String,
  'Drug Efficacy Databases': String,
  'dbSNP Link': String,
  smiles: String,
  molecule: mongoose.Schema.Types.Mixed,
  structureSource: String,
  structureLookupName: String,
  structureLastCheckedAt: Date,
}, { strict: false });

const pubmedSchema = new mongoose.Schema({
  Drug: String,
  Biomarker: String,
  'Num of Article': Number,
  PMID: String,
}, { strict: false });

const MinorityInfo = mongoose.model('MinorityInfo', minorityInfoSchema, 'minority_info');
const PubmedLiterature = mongoose.model('PubmedLiterature', pubmedSchema, 'pubmed_literature');

function cleanCandidate(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function getSmilesFromPubChem(name) {
  const encoded = encodeURIComponent(name);
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/CanonicalSMILES/JSON`;
  const response = await axios.get(url, { timeout: 15000 });
  return response.data?.PropertyTable?.Properties?.[0]?.CanonicalSMILES || null;
}

async function getSmilesFromNCI(identifier) {
  const encoded = encodeURIComponent(identifier);
  const url = `https://cactus.nci.nih.gov/chemical/structure/${encoded}/smiles`;
  const response = await axios.get(url, {
    timeout: 15000,
    responseType: 'text',
    transformResponse: [(data) => data],
  });

  if (typeof response.data !== 'string') return null;
  const smiles = response.data.trim();
  if (!smiles || smiles.toLowerCase().startsWith('page not found')) return null;
  return smiles;
}

async function resolveSmiles(record) {
  const candidates = [
    cleanCandidate(record.Drug),
    cleanCandidate(record.CAS),
    cleanCandidate(record.cas),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      const smiles = await getSmilesFromPubChem(candidate);
      if (smiles) {
        return { smiles, source: 'PubChem', lookupName: candidate };
      }
    } catch (_) {}

    try {
      const smiles = await getSmilesFromNCI(candidate);
      if (smiles) {
        return { smiles, source: 'NCI Resolver', lookupName: candidate };
      }
    } catch (_) {}
  }

  return null;
}

app.get('/api/minority-info', async (req, res) => {
  try {
    const data = await MinorityInfo.find({}, { _id: 0 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pubmed-literature', async (req, res) => {
  try {
    const data = await PubmedLiterature.find({}, { _id: 0 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/unique-drugs', async (req, res) => {
  try {
    const drugs = await MinorityInfo.distinct('Drug');
    const drugDetails = await Promise.all(
      drugs.map(async (drug) => {
        const first = await MinorityInfo.findOne({ Drug: drug });
        return {
          name: drug,
          biomarker: first?.Biomarker || 'N/A',
          area: first?.['Therapeutic Area'] || 'N/A',
          smiles: first?.smiles || null,
        };
      })
    );
    res.json(drugDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/unique-biomarkers', async (req, res) => {
  try {
    const biomarkers = await MinorityInfo.distinct('Biomarker');
    res.json(biomarkers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/therapeutic-areas', async (req, res) => {
  try {
    const areas = await MinorityInfo.distinct('Therapeutic Area');
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search-drugs', async (req, res) => {
  try {
    const { name, biomarker, area } = req.query;
    const query = {};

    if (name) query.Drug = { $regex: name, $options: 'i' };
    if (biomarker) query.Biomarker = { $regex: biomarker, $options: 'i' };
    if (area) query['Therapeutic Area'] = { $regex: area, $options: 'i' };

    const drugs = await MinorityInfo.find(query).limit(100);
    res.json(drugs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/enrich-smiles', async (req, res) => {
  try {
    const limit = Math.min(Number(req.body?.limit || req.query?.limit || 100), 500);
    const force = String(req.body?.force || req.query?.force || 'false').toLowerCase() === 'true';

    const filter = force
      ? {}
      : {
          $or: [
            { smiles: { $exists: false } },
            { smiles: null },
            { smiles: '' },
          ],
        };

    const docs = await MinorityInfo.find(filter).limit(limit);

    let updated = 0;
    let notFound = 0;
    const results = [];

    for (const doc of docs) {
      const resolved = await resolveSmiles(doc);

      if (resolved?.smiles) {
        await MinorityInfo.updateOne(
          { _id: doc._id },
          {
            $set: {
              smiles: resolved.smiles,
              structureSource: resolved.source,
              structureLookupName: resolved.lookupName,
              structureLastCheckedAt: new Date(),
            },
          }
        );
        updated += 1;
        results.push({ Drug: doc.Drug, smiles: resolved.smiles, source: resolved.source });
      } else {
        await MinorityInfo.updateOne(
          { _id: doc._id },
          { $set: { structureLastCheckedAt: new Date() } }
        );
        notFound += 1;
        results.push({ Drug: doc.Drug, smiles: null, source: null });
      }
    }

    res.json({
      message: 'SMILES enrichment completed',
      checked: docs.length,
      updated,
      notFound,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drug-structure/:drugName', async (req, res) => {
  try {
    const drugName = req.params.drugName;
    const record = await MinorityInfo.findOne({
      Drug: { $regex: `^${drugName}$`, $options: 'i' },
    });

    if (!record) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    res.json({
      Drug: record.Drug,
      Biomarker: record.Biomarker,
      smiles: record.smiles || null,
      molecule: record.molecule || null,
      structureSource: record.structureSource || null,
      structureLookupName: record.structureLookupName || null,
      structureLastCheckedAt: record.structureLastCheckedAt || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Endpoints available:');
  console.log('- GET /api/minority-info');
  console.log('- GET /api/pubmed-literature');
  console.log('- GET /api/unique-drugs');
  console.log('- GET /api/unique-biomarkers');
  console.log('- GET /api/therapeutic-areas');
  console.log('- GET /api/search-drugs');
  console.log('- POST /api/enrich-smiles');
  console.log('- GET /api/drug-structure/:drugName');
});
