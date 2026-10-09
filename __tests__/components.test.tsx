import { fireEvent, render, screen } from '@testing-library/react-native';
import { SizeGrid } from '@/components/SizeGrid';
import { Timeline } from '@/components/Timeline';
import { ProductCard } from '@/components/ProductCard';
import type { OrderStatusResponse, Product } from '@/types';

jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(), selectionAsync: jest.fn(), notificationAsync: jest.fn(), ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' } }));

describe('SizeGrid', () => {
  it('désactive les tailles indisponibles et sélectionne les autres', async () => {
    const onSelect = jest.fn();
    await render(<SizeGrid sizes={['S', 'M', 'L']} selected="M" isAvailable={(s) => s !== 'L'} onSelect={onSelect} />);
    await fireEvent.press(screen.getByLabelText('Taille S'));
    expect(onSelect).toHaveBeenCalledWith('S');
    const l = screen.getByLabelText('Taille L, indisponible');
    expect(l.props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(l);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

const order = (o: Partial<OrderStatusResponse>): OrderStatusResponse => ({ reference: 'NVR-261009-A1B2', status: 'paid', paid: true, fulfilment: 'delivery', ...o });

describe('Timeline', () => {
  it('livraison : 4 étapes, étapes faites jusqu’au statut courant', async () => {
    await render(<Timeline order={order({ status: 'shipped' })} />);
    expect(screen.getByLabelText('Expédiée, fait')).toBeTruthy();
    expect(screen.getByLabelText('Livrée, à venir')).toBeTruthy();
  });
  it('retrait : étapes dédiées', async () => {
    await render(<Timeline order={order({ fulfilment: 'pickup', status: 'ready_for_pickup' })} />);
    expect(screen.getByLabelText('Prête au retrait, fait')).toBeTruthy();
    expect(screen.getByLabelText('Retirée, à venir')).toBeTruthy();
  });
  it('état spécial : annulée', async () => {
    await render(<Timeline order={order({ status: 'cancelled', paid: false })} />);
    expect(screen.getByText('Annulée')).toBeTruthy();
  });
});

const p: Product = {
  id: 'p', slug: 'polo', name: 'Polo Tech', category: 'polos', categoryLabel: 'Polos', gender: 'homme', price: 45.99, description: '',
  images: ['https://x/a.jpg'], colors: ['Noir'], sizes: ['M'], variants: [], trackInventory: false, isNew: true, featured: false,
  technicalDetails: [], composition: '', care: '', focalX: 50, focalY: 50,
};

describe('ProductCard', () => {
  it('affiche nom, prix au format du site et badge Nouveauté', async () => {
    await render(<ProductCard product={p} />);
    expect(screen.getByText('Polo Tech')).toBeTruthy();
    expect(screen.getByText('45,99 €')).toBeTruthy();
    expect(screen.getByText('Nouveauté')).toBeTruthy();
  });
});
