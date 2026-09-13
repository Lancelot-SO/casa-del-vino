import type { ChangeEvent, FormEvent } from 'react';
import { CATEGORIES } from '../../data/catalog';
import { useLayout, useStore } from '../../store/store';
import { Btn, Input, Select, Textarea } from '../ui/Hoverable';
import { Icon } from '../ui/Icon';
import { adminField, adminGhost, adminLabel, adminPrimary, focusRed } from './shared';
import type { Product, ProductDraft } from '../../types';

const COUNTRIES = ['Spain', 'Italy', 'Sweden', 'France'];

const BLANK: ProductDraft = {
  id: '__new',
  name: '',
  category: 'Red wine',
  country: 'Spain',
  origin: '',
  size: '',
  abv: '',
  price: '',
  img: '',
  images: [],
  description: '',
  ingredients: '',
  listText: '',
};

/** Open the form on an existing bottle, or blank for a new one. */
export function draftFrom(p: Product | null): ProductDraft {
  if (!p) return { ...BLANK };
  return {
    ...p,
    price: String(p.price),
    images: p.images && p.images.length ? p.images : p.img ? [p.img] : [],
    listText: (p.list || []).map((x) => x[0]).join(', '),
  };
}

/** Add / edit a bottle: the photo strip, then every field the shop shows. */
export function ProductForm() {
  const { state, set, products, saveProducts, logActivity } = useStore();
  const L = useLayout();
  const ed = state.adminEdit;
  if (!ed) return null;

  const isNew = ed.id === '__new';
  const patch = (p: Partial<ProductDraft>) => set((s) => (s.adminEdit ? { adminEdit: { ...s.adminEdit, ...p } } : null));
  const setField = (name: keyof ProductDraft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    patch({ [name]: e.target.value } as Partial<ProductDraft>);

  const cover = ed.images[0] || ed.img || 'assets/syrah.jpg';

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((f) => {
      const rd = new FileReader();
      rd.onload = () =>
        set((s) => {
          if (!s.adminEdit) return null;
          const images = [...s.adminEdit.images, rd.result as string];
          return { adminEdit: { ...s.adminEdit, images, img: images[0] } };
        });
      rd.readAsDataURL(f);
    });
    e.target.value = '';
  };

  const addUrl = () => {
    const u = (ed.imgUrl || '').trim();
    if (!u) return;
    const images = [...ed.images, u];
    patch({ images, img: images[0], imgUrl: '' });
  };

  const makeCover = (i: number) => {
    const images = [...ed.images];
    const [x] = images.splice(i, 1);
    images.unshift(x);
    patch({ images, img: images[0] });
  };

  const removeImage = (i: number) => {
    const images = ed.images.filter((_, k) => k !== i);
    patch({ images, img: images[0] || '' });
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    const list = (ed.listText || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .map((l) => [l, l.replace(/\s+/g, '_'), 'leaf'] as [string, string, string]);
    const record: Product = {
      id: isNew ? (ed.name || 'bottle').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36) : ed.id,
      name: ed.name.trim(),
      category: ed.category,
      country: ed.country,
      origin: ed.origin || ed.country,
      size: ed.size,
      abv: ed.abv,
      price: parseFloat(String(ed.price).replace(',', '.')) || 0,
      img: ed.images[0] || ed.img || 'assets/syrah.jpg',
      images: ed.images.length ? ed.images : [ed.img || 'assets/syrah.jpg'],
      description: ed.description,
      ingredients: ed.ingredients,
      list,
    };
    logActivity(isNew ? 'product-added' : 'product-updated', record.name, record.id);
    saveProducts(isNew ? [...products, record] : products.map((x) => (x.id === ed.id ? record : x)));
  };

  return (
    <form
      onSubmit={save}
      style={{
        background: 'linear-gradient(160deg,#241012,#160a0c)',
        color: '#f3ece2',
        border: '1px solid rgba(243,236,226,.08)',
        borderRadius: 24,
        padding: L.panelPad,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
        gap: 22,
        animation: 'cdvRise .4s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 30, margin: 0, lineHeight: 1.05 }}>
          {isNew ? 'Add a bottle' : 'Edit bottle'}
        </h2>
        <div style={{ aspectRatio: '3/4', maxHeight: 320, borderRadius: 18, overflow: 'hidden', background: '#0f0708', position: 'relative' }}>
          <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
              fontSize: 10,
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              padding: '4px 8px',
              borderRadius: 999,
              background: 'rgba(194,43,69,.9)',
              color: '#fff4f5',
            }}
          >
            Cover
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ed.images.map((src, i) => (
            <div
              key={src.slice(0, 40) + i}
              onClick={() => makeCover(i)}
              title="Set as cover"
              style={{
                position: 'relative',
                width: 64,
                height: 76,
                borderRadius: 12,
                overflow: 'hidden',
                border: `2px solid ${i === 0 ? '#c22b45' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <Btn
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                aria-label="Remove image"
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,.7)',
                  color: '#f3ece2',
                  display: 'grid',
                  placeItems: 'center',
                }}
                hoverStyle={{ background: '#c22b45' }}
              >
                <Icon size={10} strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </Icon>
              </Btn>
            </div>
          ))}
          <label
            title="Add photos"
            style={{
              width: 64,
              height: 76,
              borderRadius: 12,
              border: '1px dashed rgba(243,236,226,.35)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              fontSize: 22,
              opacity: 0.7,
            }}
          >
            +
            <input type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
          </label>
        </div>
        <span style={{ fontSize: 11, opacity: 0.55 }}>
          {ed.images.length} {ed.images.length === 1 ? 'photo' : 'photos'} · click a thumbnail to make it the cover
        </span>

        <label style={adminLabel}>
          Add image by URL
          <span style={{ display: 'flex', gap: 8 }}>
            <Input
              name="imgUrl"
              value={ed.imgUrl || ''}
              onChange={setField('imgUrl')}
              placeholder="https://…"
              style={adminField}
              focusStyle={focusRed}
            />
            <Btn
              onClick={addUrl}
              style={{
                height: 44,
                padding: '0 16px',
                borderRadius: 12,
                background: '#c22b45',
                color: '#fff4f5',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                flex: 'none',
              }}
              hoverStyle={{ filter: 'brightness(1.12)' }}
            >
              Add
            </Btn>
          </span>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={adminLabel}>
          Name
          <Input required name="name" value={ed.name} onChange={setField('name')} placeholder="e.g. Rioja Reserva" style={adminField} focusStyle={focusRed} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
          <label style={adminLabel}>
            Category
            <Select name="category" value={ed.category} onChange={setField('category')} style={adminField} focusStyle={focusRed}>
              {CATEGORIES.slice(1).map(([label]) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label style={adminLabel}>
            Country
            <Select name="country" value={ed.country} onChange={setField('country')} style={adminField} focusStyle={focusRed}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <label style={adminLabel}>
          Origin (region)
          <Input name="origin" value={ed.origin} onChange={setField('origin')} placeholder="e.g. Rioja, Spain" style={adminField} focusStyle={focusRed} />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
          <label style={adminLabel}>
            Alcohol
            <Input required name="abv" value={ed.abv} onChange={setField('abv')} placeholder="13.5%" style={adminField} focusStyle={focusRed} />
          </label>
          <label style={adminLabel}>
            Size
            <Input name="size" value={ed.size} onChange={setField('size')} placeholder="75cl" style={adminField} focusStyle={focusRed} />
          </label>
          <label style={adminLabel}>
            Price €
            <Input
              required
              name="price"
              value={ed.price}
              onChange={setField('price')}
              inputMode="decimal"
              placeholder="12.50"
              style={adminField}
              focusStyle={focusRed}
            />
          </label>
        </div>
        <label style={adminLabel}>
          Description
          <Textarea
            name="description"
            value={ed.description}
            onChange={setField('description')}
            rows={3}
            style={{ ...adminField, height: 'auto', padding: '12px 14px', resize: 'vertical' }}
            focusStyle={focusRed}
          />
        </label>
        <label style={adminLabel}>
          Ingredients (as on the label)
          <Textarea
            name="ingredients"
            value={ed.ingredients}
            onChange={setField('ingredients')}
            rows={2}
            style={{ ...adminField, height: 'auto', padding: '12px 14px', resize: 'vertical' }}
            focusStyle={focusRed}
          />
        </label>
        <label style={adminLabel}>
          Floating ingredients (comma separated)
          <Input
            name="listText"
            value={ed.listText}
            onChange={setField('listText')}
            placeholder="Blackberry, Plum, Black pepper"
            style={adminField}
            focusStyle={focusRed}
          />
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <button type="submit" style={{ all: 'unset', cursor: 'pointer', ...adminPrimary }}>
            Save bottle
          </button>
          <Btn onClick={() => set({ adminEdit: null })} style={adminGhost} hoverStyle={{ borderColor: '#c22b45', color: '#c22b45' }}>
            Cancel
          </Btn>
        </div>
      </div>
    </form>
  );
}
