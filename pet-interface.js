export class PetInterface {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api/adoption';
    }

    async #request(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Ocorreu um erro na requisição.');
            }
            return { success: true, data: result };
        } catch (error) {
            console.error(`Erro na API (${method} ${endpoint}):`, error.message);
            return { success: false, error: error.message };
        }
    }

    async getPetById(id) {
        const result = await this.#request(`/pets/${id}`);
        return result.success ? { success: true, pet: result.data.pet } : result;
    }

    async favoritePet(userId, petId) {
        return this.#request(`/favorites`, 'POST', { userId, petId });
    }

    async unfavoritePet(userId, petId) {
        return this.#request(`/favorites/unfavorite`, 'POST', { userId, petId });
    }

    async fetchPets(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        const result = await this.#request(`/pets${queryString ? `?${queryString}` : ''}`);
        return result.success ? { success: true, pets: result.data.pets } : result;
    }

    async getDonorContactInfo(petId) {
        const result = await this.#request(`/pets/${petId}/donor`);
        return result.success ? { success: true, donor: result.data.donor } : result;
    }
}