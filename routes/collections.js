const express = require('express');
const router = express.Router();
const pool = require('../db'); // adjust path to your DB connection file




// Create a new collection
router.post("/artists/collections", async (req, res) => {
  try {
    const { name, description, cover_image } = req.body;

    if (!name || !description || !cover_image) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO collections (name, description, cover_image)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description, cover_image]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating collection:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET all collections with their assets
router.get("/artists/collections", async (req, res) => {
  try {

    // Fetch all collections
    const collectionsResult = await pool.query("SELECT * FROM collections");
    const collections = collectionsResult.rows;

    // If no collections exist, return an empty array
    if (collections.length === 0) {
      return res.json([]);
    }

    // Fetch all assets related to these collections
    const collectionIds = collections.map((col) => col.id);
    const assetsResult = await pool.query(
"SELECT * FROM collection_assets WHERE collection_id = ANY($1::int[])",
      [collectionIds]
    );
    const assets = assetsResult.rows;

    // Group assets by collection_id
    const assetsByCollection = {};
    for (const asset of assets) {
      if (!assetsByCollection[asset.collection_id]) {
        assetsByCollection[asset.collection_id] = [];
      }
      assetsByCollection[asset.collection_id].push(asset);
    }

    // Attach assets to their corresponding collections
    const enrichedCollections = collections.map((collection) => ({
      ...collection,
      assets: assetsByCollection[collection.id] || [],
    }));

    res.json(enrichedCollections);
  } catch (err) {
    console.error("Error fetching collections:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// GET site text
// Get collection + its assets
router.get("/artists/collection/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch collection
    const collectionResult = await pool.query(
      "SELECT * FROM collections WHERE id = $1",
      [id]
    );

    if (collectionResult.rows.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const collection = collectionResult.rows[0];

    // Fetch related assets
    const assetsResult = await pool.query(
      "SELECT * FROM collection_assets WHERE collection_id = $1",
      [id]
    );

    res.json({
      ...collection,
      assets: assetsResult.rows
    });
  } catch (err) {
    console.error("Error fetching collection:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// Add asset to collection
router.post("/:id/assets", async (req, res) => {
  try {
    const collectionId = req.params.id;
    const {
      title,
      type,
      file_name,
      song_url,
      price,
      scarcity,
      utility,
      tags,
      geo,
      image_url,
      video_url
    } = req.body;

    const result = await pool.query(
      `INSERT INTO collection_assets 
        (collection_id, title, type, file_name, song_url, price, scarcity, utility, tags, geo, image_url, video_url)
       VALUES 
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [collectionId, title, type, file_name, song_url, price, scarcity, utility, tags, geo, image_url, video_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding asset:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create collection + assets in one request
router.post("/artists/:artist_id/collections", async (req, res) => {
  const client = await pool.connect();
  try {
    const { artist_id } = req.params;
    const {  
  collection_name,
  description,
  cover_image,
  floor_price,
  highest_sale,
  volume,
  items,
  owners,
  project_overview,
  nft_collection_details,
  utility_and_membership_benefit,
  assets 
} = req.body;

    await client.query("BEGIN");

    // 🔹 Get artist name from artists table
    const artistResult = await client.query(
      `SELECT name FROM artists WHERE id = $1`,
      [artist_id]
    );

    if (artistResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Artist not found" });
    }

    const artist_name = artistResult.rows[0].name;

    // 🔹 Insert into collections
// 🔹 Insert into collections with all fields
    const collectionResult = await client.query(
      `INSERT INTO collections (
        artist_id, artist_name, collection_name, description, cover_image,
        floor_price, highest_sale, volume, items, owners,
        project_overview, nft_collection_details, utility_and_membership_benefit
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13
      )
      RETURNING *`,
      [
        artist_id,
        artist_name,
        collection_name,
        description,
        cover_image,
        floor_price || null,
        highest_sale || null,
        volume || null,
        items || null,
        owners || null,
        project_overview || null,
        nft_collection_details || null,
        utility_and_membership_benefit || null
      ]
    );

    const collection = collectionResult.rows[0];

    // Insert assets if provided
    if (assets && assets.length > 0) {
      for (let asset of assets) {
        await client.query(
          `INSERT INTO collection_assets 
            (collection_id, artist_id, type, title, file_name, song_url, image_url, video_url, price, scarcity, utility, tags, geo, hide, approved, isfeatured, isboosted)
           VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            collection.id,
            artist_id,
            asset.type,
            asset.title,
            asset.file_name || null,
            asset.song_url || null,
            asset.image_url,
            asset.video_url || null,
            asset.price || null,
            asset.scarcity || null,
            asset.utility || null,
            asset.tags || null,
            asset.geo || null,
            asset.hide ?? true,
            asset.approved ?? false,
            asset.isfeatured ?? false,
            asset.isboosted ?? false,
          ]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ 
      message: "Collection created successfully", 
      collection,
      assets_created: assets ? assets.length : 0
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error creating collection with assets:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /artists/{artist_id}/collections - Get all collections + assets
router.get("/artists/:artist_id/collections", async (req, res) => {
  const client = await pool.connect();
  try {
    const { artist_id } = req.params;

    const result = await client.query(
      `
      SELECT c.*,
             COALESCE(
               json_agg(a.*) FILTER (WHERE a.id IS NOT NULL), '[]'
             ) AS assets
      FROM collections c
      LEFT JOIN collection_assets a ON c.id = a.collection_id
      WHERE c.artist_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `,
      [artist_id]
    );

    res.json({
      collections: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Error fetching artist collections:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


// GET /artists/{artist_id}/collections/{collection_id} - Get specific collection with its assets
router.get("/artists/:artist_id/collections/:collection_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { artist_id, collection_id } = req.params;
    
    // Get collection details
    const collectionResult = await client.query(
      `SELECT * FROM collections 
       WHERE id = $1 AND artist_id = $2`,
      [collection_id, artist_id]
    );
    
    if (collectionResult.rows.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    // Get assets for this collection
    const assetsResult = await client.query(
      `SELECT * FROM collection_assets 
       WHERE collection_id = $1 AND artist_id = $2
       ORDER BY created_at DESC`,
      [collection_id, artist_id]
    );
    
    const collection = collectionResult.rows[0];
    collection.assets = assetsResult.rows;
    
    res.json({
      collection,
      asset_count: assetsResult.rows.length
    });
  } catch (err) {
    console.error("Error fetching collection:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /artists/{artist_id}/collections/{collection_id}/assets/{asset_id} - Get specific asset
router.get("/artists/:artist_id/collections/:collection_id/assets/:asset_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { artist_id, collection_id, asset_id } = req.params;
    
    // Verify collection exists and belongs to artist
    const collectionCheck = await client.query(
      `SELECT id FROM collections 
       WHERE id = $1 AND artist_id = $2`,
      [collection_id, artist_id]
    );
    
    if (collectionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    // Get specific asset
    const assetResult = await client.query(
      `SELECT * FROM collection_assets 
       WHERE id = $1 AND collection_id = $2 AND artist_id = $3`,
      [asset_id, collection_id, artist_id]
    );
    
    if (assetResult.rows.length === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }
    
    res.json({
      asset: assetResult.rows[0]
    });
  } catch (err) {
    console.error("Error fetching asset:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /artists/{artist_id}/collections/{collection_id}/assets/{asset_id}
router.put("/artists/:artist_id/collections/:collection_id/assets/:asset_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { artist_id, collection_id, asset_id } = req.params;
    const {
      type,
      title,
      file_name,
      song_url,
      image_url,
      video_url,
      price,
      scarcity,
      utility,
      tags,
      geo,
      hide,
      approved,
      isfeatured,
      isboosted
    } = req.body;

    // Verify collection exists and belongs to artist
    const collectionCheck = await client.query(
      `SELECT id FROM collections 
       WHERE id = $1 AND artist_id = $2`,
      [collection_id, artist_id]
    );
    
    if (collectionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }

    const result = await client.query(
      `UPDATE collection_assets 
       SET type = $1, title = $2, file_name = $3,
           song_url = $4, image_url = $5, video_url = $6,
           price = $7, scarcity = $8, utility = $9,
           tags = $10, geo = $11, hide = $12,
           approved = $13, isfeatured = $14, isboosted = $15,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 AND collection_id = $17 AND artist_id = $18
       RETURNING *`,
      [
        type,
        title,
        file_name,
        song_url,
        image_url,
        video_url,
        price,
        scarcity,
        utility,
        tags,
        geo,
        hide ?? true,
        approved ?? false,
        isfeatured ?? false,
        isboosted ?? false,
        asset_id,
        collection_id,
        artist_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json({
      message: "Asset updated successfully",
      asset: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating asset:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT /artists/:artist_id/collections/:id
router.put("/artists/:artist_id/collections/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { artist_id, id } = req.params;
    const {
      collection_name,
      description,
      cover_image,
      artist_name,
      floor_price,
      highest_sale,
      volume,
      items,
      owners,
      project_overview,
      nft_collection_details,
      utility_and_membership_benefit
    } = req.body;

    let fields = [];
    let values = [];
    let idx = 1;

    if (collection_name !== undefined) {
      fields.push(`collection_name = $${idx++}`);
      values.push(collection_name);
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (cover_image !== undefined) {
      fields.push(`cover_image = $${idx++}`);
      values.push(cover_image);
    }
    if (artist_name !== undefined) {
      fields.push(`artist_name = $${idx++}`);
      values.push(artist_name);
    }
    if (floor_price !== undefined) {
      fields.push(`floor_price = $${idx++}`);
      values.push(floor_price);
    }
    if (highest_sale !== undefined) {
      fields.push(`highest_sale = $${idx++}`);
      values.push(highest_sale);
    }
    if (volume !== undefined) {
      fields.push(`volume = $${idx++}`);
      values.push(volume);
    }
    if (items !== undefined) {
      fields.push(`items = $${idx++}`);
      values.push(items);
    }
    if (owners !== undefined) {
      fields.push(`owners = $${idx++}`);
      values.push(owners);
    }
    if (project_overview !== undefined) {
      fields.push(`project_overview = $${idx++}`);
      values.push(project_overview);
    }
    if (nft_collection_details !== undefined) {
      fields.push(`nft_collection_details = $${idx++}`);
      values.push(nft_collection_details);
    }
    if (utility_and_membership_benefit !== undefined) {
      fields.push(`utility_and_membership_benefit = $${idx++}`);
      values.push(utility_and_membership_benefit);
    }

    // always update updated_at
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    // add where condition values
    values.push(id);
    values.push(artist_id);

    if (fields.length === 1) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const query = `
      UPDATE collections
      SET ${fields.join(", ")}
      WHERE id = $${idx++} AND artist_id = $${idx}
      RETURNING *;
    `;

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Collection not found" });
    }

    res.json({
      message: "Collection updated successfully",
      collection: result.rows[0]
    });
  } catch (err) {
    console.error("Error updating collection:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});



// Update one asset in a collection
router.put("/collections/:collection_id/assets/:asset_id", async (req, res) => {
  const client = await pool.connect();
  try {
    const { collection_id, asset_id } = req.params;
    const {
      type, title, file_name, song_url, image_url, video_url,
      price, scarcity, utility, tags, geo, hide, approved,
      isfeatured, isboosted
    } = req.body;

    const result = await client.query(
      `UPDATE collection_assets
       SET type = $1,
           title = $2,
           file_name = $3,
           song_url = $4,
           image_url = $5,
           video_url = $6,
           price = $7,
           scarcity = $8,
           utility = $9,
           tags = $10,
           geo = $11,
           hide = $12,
           approved = $13,
           isfeatured = $14,
           isboosted = $15,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $16 AND collection_id = $17
       RETURNING *`,
      [
        type, title, file_name, song_url, image_url, video_url,
        price, scarcity, utility, tags, geo,
        hide ?? true, approved ?? false,
        isfeatured ?? false, isboosted ?? false,
        asset_id, collection_id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json({ message: "Asset updated successfully", asset: result.rows[0] });
  } catch (err) {
    console.error("Error updating asset:", err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


module.exports = router;
