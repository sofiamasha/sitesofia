import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import { JsonPetRepository } from './src/database/repositories/adoption/json-pet-repository.js';
import { JsonDonorRepository } from './src/database/repositories/adoption/json-donor-repository.js';
import { JsonFavoritePetRepository } from './src/database/repositories/adoption/json-favorite-pet-repository.js';

import { GetPetUseCase } from './src/domain/adoption/application/use-cases/get-pet.js';
import { FetchPetUseCase } from './src/domain/adoption/application/use-cases/fetch-pet.js';
import { FetchPetByFilterUseCase } from './src/domain/adoption/application/use-cases/fetch-pet-by-filter.js';
import { FavoritePetUseCase } from './src/domain/adoption/application/use-cases/favorite-pet.js';
import { UnfavoritePetUseCase } from './src/domain/adoption/application/use-cases/unfavorite-pet.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const petRepository = new JsonPetRepository();
const donorRepository = new JsonDonorRepository();
const favoritePetRepository = new JsonFavoritePetRepository();

const getPetUseCase = new GetPetUseCase(petRepository);
const fetchPetUseCase = new FetchPetUseCase(petRepository);
const fetchPetByFilterUseCase = new FetchPetByFilterUseCase(petRepository);
const favoritePetUseCase = new FavoritePetUseCase(favoritePetRepository);
const unfavoritePetUseCase = new UnfavoritePetUseCase(favoritePetRepository);

const API_PREFIX = '/api/adoption';

app.get(`${API_PREFIX}/pets/:id`, async (req, res) => {
    const { id } = req.params;
    const result = await getPetUseCase.execute({ petId: id });

    if (result.isRight()) {
        return res.json({ pet: result.value.pet });
    } else {
        return res.status(404).json({ error: result.value.message });
    }
});

app.get(`${API_PREFIX}/pets`, async (req, res) => {
    const filters = req.query;
    let result;
    if (Object.keys(filters).length > 0) {
        result = await fetchPetByFilterUseCase.execute(filters);
    } else {
        result = await fetchPetUseCase.execute();
    }

    if (result.isRight()) {
        return res.json({ pets: result.value.pets });
    } else {
        return res.status(500).json({ error: result.value.message });
    }
});

app.post(`${API_PREFIX}/favorites`, async (req, res) => {
    const { userId, petId } = req.body;
    const result = await favoritePetUseCase.execute({ userId, petId });

    if (result.isRight()) {
        return res.status(201).json({ message: 'Pet favoritado com sucesso!', favoritePet: result.value.favoritePet });
    } else {
        return res.status(400).json({ error: result.value.message });
    }
});

app.post(`${API_PREFIX}/favorites/unfavorite`, async (req, res) => {
    const { userId, petId } = req.body;
    const result = await unfavoritePetUseCase.execute({ userId, petId });

    if (result.isRight()) {
        return res.json({ message: 'Pet desfavoritado com sucesso!' });
    } else {
        return res.status(400).json({ error: result.value.message });
    }
});

app.get(`${API_PREFIX}/pets/:petId/donor`, async (req, res) => {
    const { petId } = req.params;
    const petResult = await getPetUseCase.execute({ petId });

    if (petResult.isRight()) {
        const pet = petResult.value.pet;
        if (pet && pet.donorId) {
            const donor = await donorRepository.getById(pet.donorId);
            if (donor) {
                return res.json({ donor });
            } else {
                return res.status(404).json({ error: 'Doador não encontrado.' });
            }
        } else {
            return res.status(404).json({ error: 'PET ou ID do doador não encontrado.' });
        }
    } else {
        return res.status(404).json({ error: petResult.value.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor backend rodando em http://localhost:${PORT}`);
});