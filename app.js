const express = require("express");
const sqlite3 = require("sqlite3");
const app = express();
const db = new sqlite3.Database("recette.db");

app.use(express.json());

app.use(express.static("public"));

// routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/main.html");
});
app.get("/help", (req, res) => {
  res.sendFile(__dirname + "/help.html");
});
app.get("/contact", (req, res) => {
  res.sendFile(__dirname + "/contact.html");
});

//localhost:3000/recipes
app.get("/recipes", (req, res) => {
  db.all("SELECT * FROM recipes", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err, rows });
      return;
    }
    const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.send(formattedJSON);
  });
});

//http://localhost:3000/recipes/cuisine/2

app.get("/recipes/cuisine/:cuisine_id", (req, res) => {
  const { cuisine_id } = req.params;
  const sql = `
    SELECT
      title,
      description,
      image_url,
      cuisine_id,
      goal_id,
      DietaryInformation_id,
      AllergiesInformation_id
    FROM recipes
    WHERE cuisine_id = ?
  `;
  db.all(sql, [cuisine_id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.send(formattedJSON);
  });
});

//http://localhost:3000/recipes/no-allergens
app.get("/recipes/no-allergens", (req, res) => {
  const sql = `
    SELECT
      recipe_id,
      title,
      description,
      image_url,
      cuisine_id,
      goal_id,
      DietaryInformation_id
    FROM recipes
    WHERE AllergiesInformation_id IS NULL
  `;

  db.all(sql, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.send(formattedJSON);
  });
});

//http://localhost:3000/recipes/goal/4
//http://localhost:3000/recipes/goal/3
app.get("/recipes/goal/:goal_id", (req, res) => {
  const { goal_id } = req.params;
  const sql = `
    SELECT
      recipe_id,
      title,
      description,
      image_url,
      cuisine_id,
      goal_id,
      DietaryInformation_id,
      AllergiesInformation_id
    FROM recipes
    WHERE goal_id = ?
  `;

  db.all(sql, [goal_id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const formattedJSON = JSON.stringify({ recipes: rows }, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.send(formattedJSON);
  });
});

//http://localhost:3000/recipes/1
//http://localhost:3000/recipes/2

app.get("/recipes/:recipe_id", (req, res) => {
  const { recipe_id } = req.params;
  const sql = `
    SELECT
      recipe_id,
      title,
      description,
      image_url,
      cuisine_id,
      goal_id,
      DietaryInformation_id,
      AllergiesInformation_id
    FROM recipes
    WHERE recipe_id = ?
  `;

  db.get(sql, [recipe_id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: "Recette non trouvée" });
      return;
    }

    const formattedJSON = JSON.stringify({ recipe: row }, null, 2);

    res.setHeader("Content-Type", "application/json");
    res.send(formattedJSON);
  });
});

//ajout url

//http://localhost:3000/cuisines/mexicaine

app.post("/cuisines/:name", (req, res) => {
  const { name } = req.params;
  const sql = "INSERT INTO Cuisines (name) VALUES (?)";

  db.run(sql, [name], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.status(201).json({ message: `Cuisine "${name}" ajoutée avec succès.` });
  });
});

app.get("/recipes/addingredient/:idRecipe/:idIngredient", (req, res) => {
  const idRecipe = parseInt(req.params.idRecipe);
  const idIngredient = parseInt(req.params.idIngredient);

  db.run(
    `INSERT INTO RecipeIngredients (recipe_id, ingredient_id) VALUES (?, ?)`,
    [idRecipe, idIngredient],
    function (err) {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({ error: `Erreur lors de l'ajout de l'ingrédient` });
      }
      res.status(200).json({ message: "Ingrédient ajouté avec succès" });
    }
  );
});

//ajout avec json

//http://localhost:3000/newcuisine
app.post("/newcuisine", (req, res) => {
  const { namecuisine } = req.body;
  if (!namecuisine) {
    res.status(400).json({ error: "nom oligatoire" });
    return;
  }
  const query = "INSERT INTO cuisines (name) VALUES (?)";
  db.run(query, [namecuisine], function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    res.json({
      id: this.lastID,
      namecuisine,
    });
  });
});

//http://localhost:3000/recipesjson
app.post("/recipesjson", (req, res) => {
  const {
    title,
    description,
    cuisine_id,
    goal_id,
    DietaryInformation_id,
    AllergiesInformation_id,
  } = req.body;

  if (!title || !description || !cuisine_id || !goal_id) {
    res
      .status(400)
      .json({ error: "Tous les champs obligatoires doivent être renseignés." });
    return;
  }

  const recipeSQL = `
    INSERT INTO Recipes (title, description, cuisine_id, goal_id, DietaryInformation_id, AllergiesInformation_id)
    VALUES (?, ?, ?, ?, ?, ?);
  `;
  const recipeID = this.lastID;
  db.run(
    recipeSQL,
    [
      title,
      description,
      cuisine_id,
      goal_id,
      DietaryInformation_id,
      AllergiesInformation_id,
    ],
    function (err) {
      if (err) {
        console.error(err.message);
        res.status(500).json({ error: "Erreur interne du serveur" });
        return;
      }

      res.status(201).json({
        message: "Recette ajoutée avec succès.",
        recipe_id: recipeID,
      });
    }
  );
});

//mise a jour

app.get("/recipes/:title/newnaneis/:newname", (req, res) => {
  const title = req.params.title;
  const newname = req.params.newname;
  db.run(
    `UPDATE Recipes SET title = ? WHERE title = ?`,
    [newname, title],
    function (err) {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({
            error: "Erreur lors de la modification du nom de la recette",
          });
      }
      res
        .status(200)
        .json({ message: "Nom de recette mis à jour avec succès" });
    }
  );
});

app.get(
  "/recipes/AllergiesInformation_id/:recipe_id/:n_allergens",
  (req, res) => {
    const recipe_id = req.params.recipe_id;
    const n_allergens = req.params.n_allergens;
    db.run(
      `
        UPDATE Recipes
        SET AllergiesInformation_id = (
            SELECT allergy_id
            FROM AllergiesInformation
            WHERE name = ?
        )
        WHERE recipe_id = ?`,
      [n_allergens, recipe_id],
      function (err) {
        if (err) {
          console.error(err.message);
          return res
            .status(500)
            .json({ error: "Erreur lors de la modification des allergies" });
        }
        res.status(200).json({ message: "Allergies mises à jour avec succès" });
      }
    );
  }
);



app.get("/recipes/:recipe_id/description/maj/:description", (req, res) => {
  const instruction_id = parseInt(req.params.instruction_id);
  const description = req.params.description;
  db.run(
    `UPDATE RecipeInstructions SET description = ? WHERE instruction_id = ?`,
    [description, instruction_id],
    function (err) {
      if (err) {
        console.error(err.message);
        return res.status(500).json({
          error: `Erreur lors de la modification de la description de l'étape de recette`,
        });
      }
      res
        .status(200)
        .json({ message: `Description de l'étape mise à jour avec succès` });
    }
  );
});

//suppression

//http://localhost:3000/suprecipe/1

app.delete("/suprecipe/:recipe_id", (req, res) => {
  const { recipe_id } = req.params;
  const sql = "DELETE FROM Recipes WHERE recipe_id = recipe_id";

  db.run(sql, [recipe_id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    res.status(200).json({ message: "Recette supprimée avec succès." });
  });
});

app.delete("/suprecipe/:recipe_id/:idIngredient", (req, res) => {
  const idRecipe = parseInt(req.params.idRecipe);
  const idIngredient = parseInt(req.params.idIngredient);

  db.run(
    `DELETE From RecipeIngredients (recipe_id, ingredient_id) VALUES (?, ?)`,
    [idRecipe, idIngredient],
    function (err) {
      if (err) {
        console.error(err.message);
        return res
          .status(500)
          .json({ error: `Erreur lors de la suppresion de l'ingrédient` });
      }
      res.status(200).json({ message: "Ingrédient supprimer avec succès" });
    }
  );
});

// debut server

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
