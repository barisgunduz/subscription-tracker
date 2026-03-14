import servicesData from '@/data/services.json';

export type Service = {
  id: number;
  key: string;
  name: string;
  category: string;
  logo: string;
};

const services = servicesData as Service[];

function normalizeValue(value: string) {
  return value.trim().toLowerCase();
}

export function listAllServices(): Service[] {
  return [...services];
}

export function getServiceByKey(key: string): Service | undefined {
  const normalizedKey = normalizeValue(key);

  return services.find((service) => normalizeValue(service.key) === normalizedKey);
}

export function searchServices(query: string): Service[] {
  const normalizedQuery = normalizeValue(query);

  if (!normalizedQuery) {
    return listAllServices();
  }

  return services.filter((service) => {
    const searchableValues = [service.name, service.key, service.category];

    return searchableValues.some((value) => normalizeValue(value).includes(normalizedQuery));
  });
}
