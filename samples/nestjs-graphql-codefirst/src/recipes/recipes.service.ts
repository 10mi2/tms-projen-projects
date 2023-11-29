import { Injectable } from "@nestjs/common";
import { NewRecipeInput } from "./dto/new-recipe.input";
import { RecipesArgs } from "./dto/recipes.args";
import { Recipe } from "./models/recipe.model";

const allRecipes: Recipe[] = [];
let nextID = 0;

@Injectable()
export class RecipesService {
  /**
   * MOCK
   * Put some real business logic here
   * Left for demonstration purposes
   */

  async create(_data: NewRecipeInput): Promise<Recipe> {
    const newRecipe = {
      ..._data,
      id: `${nextID++}`,
      creationDate: new Date(),
    } satisfies Recipe;
    allRecipes.push(newRecipe);
    return newRecipe;
  }

  async findOneById(_id: string): Promise<Recipe | null> {
    return allRecipes.find((recipe) => recipe.id === _id) ?? null;
  }

  async findAll(_recipesArgs: RecipesArgs): Promise<Recipe[]> {
    return allRecipes.slice(
      _recipesArgs.skip,
      _recipesArgs.skip + _recipesArgs.take,
    );
  }

  async remove(_id: string): Promise<boolean> {
    const recipeIndex = allRecipes.findIndex((recipe) => recipe.id === _id);
    if (recipeIndex === -1) {
      return false;
    }
    allRecipes.splice(recipeIndex, 1);
    return true;
  }
}
