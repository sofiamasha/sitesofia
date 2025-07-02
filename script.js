import { PetInterface } from '../../db-interface/pet-interface.js';
import {AdoptionInterface} from '../../db-interface/adoption-interface.js'
import {CurrentSession} from '../../utils/current-session.js' 

const gerenciamentopets = new PetInterface();
const adoptionInterface = new AdoptionInterface();
const session = new CurrentSession()

const animalTypes = {
  'ea5dc213-d45d-4a9c-b2cd-612c2de42564': 'Cachorro',
  'faccdc3f-00ea-4f6e-9b60-ebd09afb8891': 'Gato',
  '22f23a90-b097-4056-81a7-373f7af5f8a2': 'Hamster',
  '23485b50-a18d-4a3a-a9f0-6e1002cb0eff': 'Coelho',
  'd70ddae5-7cdc-46c9-b03d-62120d5e9215': 'Peixe',
  '7422243c-8a72-4998-9bd2-a480652acbbd': 'Pássaro'
};

function getAnimalTypeName(animalTypeId) {
  return animalTypes[animalTypeId] || 'Animal';
}

document.addEventListener('DOMContentLoaded', async () => {
  let pet = null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('petId')) {
    params.set('petId', '52cbc36c-bd71-420e-a1f9-f284c9cc9673');
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    history.replaceState(null, '', newUrl);
  }

  const currentPetId = params.get('petId');

  const petNameElement = document.getElementById('petName');
  const petDescriptionElement = document.getElementById('petDescription');
  const petSpeciesElement = document.getElementById('petSpecies');
  const petBreedElement = document.getElementById('petBreed');
  const petGenderElement = document.getElementById('petGender');
  const petAgeElement = document.getElementById('petAge');
  const petVaccinatedElement = document.getElementById('petVaccinated');
  const petImageElement = document.getElementById('petImage');
  const contactButton = document.getElementById('donor-btn');
  const adoptButton = document.getElementById('adoptButton');

  if (petImageElement) {
    petImageElement.style.display = 'none';
  }

  function calculateAge(bornAt) {
    if (!bornAt) return 'Não informado';

    const birthDate = new Date(bornAt);
    const today = new Date();

    if (isNaN(birthDate.getTime())) return 'Data inválida';

    const ageInMonths = Math.floor((today - birthDate) / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;

    if (years > 0) return `${years} ano(s) e ${months} mês(es)`;
    if (months > 0) return `${months} mês(es)`;
    if (ageInMonths >= 0) return 'Filhote (menos de 1 mês)';
    return 'Data de nascimento inválida';
  }

  function formatBreed(breed) {
    if (Array.isArray(breed) && breed.length > 0) return breed.join(', ');
    if (typeof breed === 'string' && breed.trim()) return breed;
    return 'Não informado';
  }

  function updateElement(element, value) {
    if (element) element.textContent = value || 'Não informado';
  }

  function loadPetImage(imgUrls, petName) {
    if (!petImageElement) return;

    if (imgUrls && Array.isArray(imgUrls) && imgUrls.length > 0 && imgUrls[0]) {
      const testImg = new Image();

      testImg.onload = function () {
        petImageElement.src = imgUrls[0];
        petImageElement.alt = `Foto de ${petName}`;
        petImageElement.style.display = 'block';
      };

      testImg.onerror = function () {
        petImageElement.style.display = 'none';
      };

      testImg.src = imgUrls[0];
    } else {
      petImageElement.style.display = 'none';
    }
  }

  if (currentPetId) {
    try {
      const result = await gerenciamentopets.getPetById({ id: currentPetId });

      if (result && result.pet) {
        pet = result.pet;

        updateElement(petNameElement, pet.pet?.props?.name);
        updateElement(petDescriptionElement, pet.pet?.props?.description);

        if (petSpeciesElement) {
          const animalTypeId = pet.pet?.props?.animalTypeId;
          petSpeciesElement.textContent = getAnimalTypeName(animalTypeId);
        }

        if (petBreedElement) {
          const breed = pet.pet?.props?.breed;
          petBreedElement.textContent = formatBreed(breed);
        }

        updateElement(petGenderElement, pet.pet?.props?.animalSex);

        if (petAgeElement) {
          console.log(pet.pet?.props?.bornAt)
          const bornAt = pet.pet?.props?.bornAt;
          petAgeElement.textContent = calculateAge(bornAt);
        }

        if (petVaccinatedElement) {
          const vaccinated = pet.pet?.props?.vaccinated;
          petVaccinatedElement.textContent = vaccinated === true ? 'Sim' :
            vaccinated === false ? 'Não' : 'Não informado';
        }

        const imgUrls = pet.pet?.props?.imgUrls;
        const petName = pet.pet?.props?.name || 'pet';
        loadPetImage(imgUrls, petName);

      } else {
        alert('Pet não encontrado.');
        const elements = [
          petNameElement, petDescriptionElement, petSpeciesElement,
          petBreedElement, petGenderElement, petAgeElement, petVaccinatedElement
        ];
        elements.forEach(el => updateElement(el, 'Pet não encontrado'));
        if (petImageElement) petImageElement.style.display = 'none';
      }

    } catch (error) {
      console.error('Erro ao carregar o pet:', error);
      alert('Erro ao carregar as informações do pet.');
      const elements = [
        petNameElement, petDescriptionElement, petSpeciesElement,
        petBreedElement, petGenderElement, petAgeElement, petVaccinatedElement
      ];
      elements.forEach(el => updateElement(el, 'Erro ao carregar'));
      if (petImageElement) petImageElement.style.display = 'none';
    }
  } else {
    alert('ID do pet não encontrado na URL.');
  }

  if (contactButton) {
    contactButton.addEventListener('click', () => {
        const donorId = pet?.pet?.props?.donorId;
        if (donorId) {
              window.location.href = `${window.location.origin}/modulos/donor-profile/index.html?donorId=${donorId}`;
        } else {
          alert("ID do doador não encontrado.");
        }
    });
  }

  if (adoptButton) {
    adoptButton.addEventListener('click', async () => {
      const confirmed = confirm('Confirma o interesse em adotar este pet?');
      if (confirmed) {
        const donorId = pet?.pet?.props?.donorId;

        const response = await adoptionInterface.registerAdoptionRequest({
          donorId,
          petId: pet?.pet?.id,
          userId: session.userId
        })

        console.log(response )
      }
    });
  }
});
