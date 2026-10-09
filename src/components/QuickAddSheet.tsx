import { useState } from 'react';
import { View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { SizeGrid } from './SizeGrid';
import { ColorDot } from './ColorDot';
import { Button } from './Button';
import { T } from './Text';
import { colors } from '@/theme';
import { isSizeAvailable } from '@/api/catalogue';
import { useAddToCart } from '@/hooks/useAddToCart';
import { fr } from '@/i18n/fr';
import type { Product } from '@/types';

type Props = { product: Product | null; onClose: () => void };

/** Sélection rapide de taille depuis une carte (pastille « + »). */
export function QuickAddSheet({ product, onClose }: Props) {
  if (!product) return null;
  // `key` : sélection réinitialisée à chaque produit.
  return <QuickAddContent key={product.slug} product={product} onClose={onClose} />;
}

function QuickAddContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const [color, setColor] = useState<string | null>(product.colors.length === 1 ? product.colors[0] : null);
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [hint, setHint] = useState<string | null>(null);
  const addToCart = useAddToCart();

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={product.name}
      footer={
        <View style={{ gap: 8 }}>
          {hint ? (
            <T variant="small" color={colors.white70} align="center" accessibilityLiveRegion="polite">
              {hint}
            </T>
          ) : null}
          <Button
            label={fr.product.addToCart}
            onPress={() => {
              const r = addToCart(product, color, size);
              if (r.ok) onClose();
              else setHint(r.reason ?? null);
            }}
          />
        </View>
      }
    >
      {product.colors.length > 1 ? (
        <View style={{ gap: 6 }}>
          <T variant="eyebrow" color={colors.white70}>
            {fr.shop.color}{color ? ` — ${color}` : ''}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {product.colors.map((c) => (
              <ColorDot key={c} name={c} size={26} active={color === c} onPress={() => setColor(c)} />
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: 8 }}>
        <T variant="eyebrow" color={colors.white70}>
          {fr.shop.size}
        </T>
        <SizeGrid sizes={product.sizes} selected={size} isAvailable={(s) => isSizeAvailable(product, s, color ?? undefined)} onSelect={(s) => { setSize(s); setHint(null); }} />
      </View>
    </BottomSheet>
  );
}
