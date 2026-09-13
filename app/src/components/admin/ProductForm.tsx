import type { ChangeEvent, FormEvent } from 'react';
import { cdn, cloudinaryConfigured } from '../../lib/cloudinary';
import { CONFIG, COUNTRIES, ING_ICON, guessIngredientIcon } from '../../data/catalog';
import * as api from '../../lib/api';
import { errorMessage, slugify, toCents } from '../../lib/format';
import { useLayout, useStore } from '../../store/store';
import { Btn, Input, Select, Textarea } from '../ui/Hoverable';
import { Icon, PathIcon } from '../ui/Icon';
import { adminField, adminGhost, adminLabel, adminPrimary, focusRed } from './shared';
import type { IngredientRef, Product, ProductDraft } from '../../types';

const BLANK: ProductDraft = {
  id: '__new',
  name: '',
  categoryId: 'red-wine',
  country: 'Spain',
  origin: '',
  size: '',
  abv: '',
  price: '',
  stock: '12',
  active: true,
  images: [],
  description: '',
  ingredients: '',
  listText: '',
  ingImages: {},
};

const keyOf = (label: string) => label.trim().toLowerCase();

/** Open the form on an existing bottle, or blank for a new one. */
export function draftFrom(p: Product | null): ProductDraft {
  if (!p) return { ...BLANK };
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    country: p.country,
    origin: p.origin,
    size: p.size,
    abv: p.abv,
    price: String(p.price),
    stock: String(p.stock),
    active: p.active,
    images: p.images.map((url) => ({ url })),
    description: p.description,
    ingredients: p.ingredients,
    listText: p.list.map((x) => x.label).join(', '),
    ingImages: {},
  };
}

/** Add / edit a bottle: the photo strip, every field the shop shows, and a photo slot per ingredient. */
export function ProductForm() {
  const { state, set, products, reloadCatalog, logActivity, toast } = useStore();
  const L = useLayout();
  const ed = state.adminEdit;
  if (!ed) return null;

  const isNew = ed.id === '__new';
  const busy = state.adminBusy;
  const categories = state.categories;
  const patch = (p: Partial<ProductDraft>) => set((s) => (s.adminEdit ? { adminEdit: { ...s.adminEdit, ...p } } : null));
  const setField = (name: keyof ProductDraft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    patch({ [name]: e.target.value } as Partial<ProductDraft>);

  const cover = ed.images[0]?.url || '/assets/syrah.jpg';
  const existingList = products.find((p) => p.id === ed.id)?.list || [];

  // The ingredient labels as typed; the shop shows the first five as medallions.
  const labels = ed.listText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const medallions = labels.slice(0, CONFIG.maxIngredients);

  /** What a medallion tile shows right now: own choice, the saved photo, or nothing (auto). */
  const tileFor = (label: string): { url: string; own: boolean; pending: boolean } => {
    const o = ed.ingImages[keyOf(label)];
    if (o) return { url: o.url, own: true, pending: !!o.file };
    if (o === null) return { url: '', own: false, pending: false };
    const prev = existingList.find((x) => keyOf(x.label) === keyOf(label));
    return { url: prev?.imageUrl || '', own: false, pending: false };
  };

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const added = files.map((file) => ({ url: URL.createObjectURL(file), file }));
    patch({ images: [...ed.images, ...added] });
    e.target.value = '';
  };

  const onIngredientFile = (label: string, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const k = keyOf(label);
    const old = ed.ingImages[k];
    if (old?.file) URL.revokeObjectURL(old.url);
    patch({ ingImages: { ...ed.ingImages, [k]: { url: URL.createObjectURL(file), file } } });
  };

  /** Drop the photo on a medallion; the system finds one again on save. */
  const clearIngredientImage = (label: string) => {
    const k = keyOf(label);
    const old = ed.ingImages[k];
    if (old?.file) URL.revokeObjectURL(old.url);
    patch({ ingImages: { ...ed.ingImages, [k]: null } });
  };

  const addUrl = () => {
    const u = (ed.imgUrl || '').trim();
    if (!u) return;
    patch({ images: [...ed.images, { url: u }], imgUrl: '' });
  };

  const makeCover = (i: number) => {
    const images = [...ed.images];
    const [x] = images.splice(i, 1);
    images.unshift(x);
    patch({ images });
  };

  const removeImage = (i: number) => {
    const gone = ed.images[i];
    if (gone?.file) URL.revokeObjectURL(gone.url);
    patch({ images: ed.images.filter((_, k) => k !== i) });
  };

  const revokeAll = () => {
    ed.images.forEach((im) => im.file && URL.revokeObjectURL(im.url));
    Object.values(ed.ingImages).forEach((im) => im?.file && URL.revokeObjectURL(im.url));
  };

  const close = () => {
    revokeAll();
    set({ adminEdit: null });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const name = ed.name.trim();
    if (!name) return;
    set({ adminBusy: true });
    try {
      let id = ed.id;
      if (isNew) {
        const base = slugify(name);
        id = (await api.productIdExists(base)) ? base + '-' + Date.now().toString(36) : base;
      }

      // Bottle photos: upload the new files, keep the URLs.
      const images: string[] = [];
      for (const im of ed.images) {
        images.push(im.file ? await api.uploadProductImage(id, im.file, im.file.name) : im.url);
      }

      // Medallions: your own photo wins; otherwise keep what the bottle had;
      // otherwise the system looks one up and caches it.
      const list: IngredientRef[] = await Promise.all(
        labels.map(async (label): Promise<IngredientRef> => {
          const prev = existingList.find((x) => keyOf(x.label) === keyOf(label));
          const base: IngredientRef = prev
            ? { ...prev, label }
            : { label, article: label.replace(/\s+/g, '_'), icon: guessIngredientIcon(label), imageUrl: null };
          const choice = ed.ingImages[keyOf(label)];
          if (choice?.file) base.imageUrl = await api.uploadIngredientImage(id, choice.file, slugify(label));
          else if (choice) base.imageUrl = choice.url;
          else if (choice === null) base.imageUrl = null;
          if (!base.imageUrl && base.article) base.imageUrl = await api.cacheIngredientImage(id, base.article);
          return base;
        }),
      );

      await api.saveProduct(
        {
          id,
          name,
          categoryId: ed.categoryId,
          country: ed.country,
          origin: ed.origin.trim() || ed.country,
          size: ed.size.trim(),
          abv: ed.abv.trim(),
          priceCents: toCents(ed.price),
          description: ed.description.trim(),
          ingredients: ed.ingredients.trim(),
          stock: Math.max(0, parseInt(ed.stock, 10) || 0),
          active: ed.active,
        },
        images,
        list,
      );
      await logActivity(isNew ? 'product-added' : 'product-updated', name, id);
      await reloadCatalog();
      revokeAll();
      set({ adminEdit: null, adminBusy: false });
      toast(isNew ? 'Bottle added' : 'Saved');
    } catch (err) {
      set({ adminBusy: false });
      toast(errorMessage(err, 'Could not save the bottle'));
    }
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
          <img src={cdn(cover, 640)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <span style={{ position: 'absolute', left: 10, top: 10, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, background: 'rgba(194,43,69,.9)', color: '#fff4f5' }}>
            Cover
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ed.images.map((im, i) => (
            <div
              key={im.url.slice(0, 60) + i}
              onClick={() => makeCover(i)}
              title="Set as cover"
              style={{ position: 'relative', width: 64, height: 76, borderRadius: 12, overflow: 'hidden', border: `2px solid ${i === 0 ? '#c22b45' : 'transparent'}`, cursor: 'pointer' }}
            >
              <img src={cdn(im.url, 160)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {im.file && <span style={{ position: 'absolute', left: 4, bottom: 4, fontSize: 9, padding: '1px 5px', borderRadius: 999, background: 'rgba(0,0,0,.7)' }}>new</span>}
              <Btn
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(i);
                }}
                aria-label="Remove image"
                style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,.7)', color: '#f3ece2', display: 'grid', placeItems: 'center' }}
                hoverStyle={{ background: '#c22b45' }}
              >
                <Icon size={10} strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </Icon>
              </Btn>
            </div>
          ))}
          <label title="Add photos" style={{ width: 64, height: 76, borderRadius: 12, border: '1px dashed rgba(243,236,226,.35)', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 22, opacity: 0.7 }}>
            +
            <input type="file" accept="image/*" multiple onChange={onFiles} style={{ display: 'none' }} />
          </label>
        </div>
        <span style={{ fontSize: 11, opacity: 0.55 }}>
          {ed.images.length} {ed.images.length === 1 ? 'photo' : 'photos'} · click a thumbnail to make it the cover ·{' '}
          {cloudinaryConfigured ? 'uploaded to Cloudinary on save' : 'Cloudinary not configured — using Supabase Storage'}
        </span>

        <label style={adminLabel}>
          Add image by URL
          <span style={{ display: 'flex', gap: 8 }}>
            <Input name="imgUrl" value={ed.imgUrl || ''} onChange={setField('imgUrl')} placeholder="https://…" style={adminField} focusStyle={focusRed} />
            <Btn
              onClick={addUrl}
              style={{ height: 44, padding: '0 16px', borderRadius: 12, background: '#c22b45', color: '#fff4f5', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', flex: 'none' }}
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
            <Select name="categoryId" value={ed.categoryId} onChange={setField('categoryId')} style={adminField} focusStyle={focusRed}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </label>
          <label style={adminLabel}>
            Country
            <Select name="country" value={ed.country} onChange={setField('country')} style={adminField} focusStyle={focusRed}>
              {[...new Set([...COUNTRIES, ed.country].filter(Boolean))].map((c) => (
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12 }}>
          <label style={adminLabel}>
            Alcohol
            <Input required name="abv" value={ed.abv} onChange={setField('abv')} placeholder="13.5%" style={adminField} focusStyle={focusRed} />
          </label>
          <label style={adminLabel}>
            Size
            <Input name="size" value={ed.size} onChange={setField('size')} placeholder="75cl" style={adminField} focusStyle={focusRed} />
          </label>
          <label style={adminLabel}>
            Price GH₵
            <Input required name="price" value={ed.price} onChange={setField('price')} inputMode="decimal" placeholder="12.50" style={adminField} focusStyle={focusRed} />
          </label>
          <label style={adminLabel}>
            Stock
            <Input required name="stock" type="number" min={0} value={ed.stock} onChange={setField('stock')} style={adminField} focusStyle={focusRed} />
          </label>
        </div>
        <label style={adminLabel}>
          Description
          <Textarea name="description" value={ed.description} onChange={setField('description')} rows={3} style={{ ...adminField, height: 'auto', padding: '12px 14px', resize: 'vertical' }} focusStyle={focusRed} />
        </label>
        <label style={adminLabel}>
          Ingredients (as on the label)
          <Textarea name="ingredients" value={ed.ingredients} onChange={setField('ingredients')} rows={2} style={{ ...adminField, height: 'auto', padding: '12px 14px', resize: 'vertical' }} focusStyle={focusRed} />
        </label>
        <label style={adminLabel}>
          Floating ingredients (comma separated · the first {CONFIG.maxIngredients} float around the bottle)
          <Input name="listText" value={ed.listText} onChange={setField('listText')} placeholder="Blackberry, Plum, Black pepper" style={adminField} focusStyle={focusRed} />
        </label>

        {medallions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'rgba(243,236,226,.7)' }}>
              Ingredient photos · click a circle to upload your own; leave it and a photo is found for you
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {medallions.map((label) => {
                const t = tileFor(label);
                return (
                  <div key={keyOf(label)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 78 }}>
                    <label
                      title={`Upload a photo for ${label}`}
                      style={{
                        position: 'relative',
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: `2px solid ${t.own ? '#c22b45' : 'rgba(224,82,107,.45)'}`,
                        background: '#200a0f',
                        display: 'grid',
                        placeItems: 'center',
                        boxShadow: t.own ? '0 0 18px rgba(194,43,69,.45)' : 'none',
                      }}
                    >
                      {t.url ? (
                        <img src={cdn(t.url, 160)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <span style={{ color: '#e0526b', display: 'grid', placeItems: 'center' }}>
                          <PathIcon d={ING_ICON[guessIngredientIcon(label)] || ING_ICON.leaf} size={28} strokeWidth={1.6} />
                        </span>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          inset: 'auto 0 0 0',
                          background: 'rgba(0,0,0,.65)',
                          color: '#f3ece2',
                          fontSize: 9,
                          letterSpacing: '.08em',
                          textTransform: 'uppercase',
                          textAlign: 'center',
                          padding: '3px 0 4px',
                        }}
                      >
                        {t.pending ? 'new' : t.own ? 'yours' : t.url ? 'saved' : 'auto'}
                      </span>
                      <input type="file" accept="image/*" onChange={(e) => onIngredientFile(label, e)} style={{ display: 'none' }} />
                    </label>
                    <span style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.2, opacity: 0.85, wordBreak: 'break-word' }}>{label}</span>
                    {(t.url || t.own) && (
                      <Btn onClick={() => clearIngredientImage(label)} style={{ fontSize: 10, color: 'rgba(243,236,226,.5)' }} hoverStyle={{ color: '#c22b45' }}>
                        use auto
                      </Btn>
                    )}
                  </div>
                );
              })}
            </div>
            {labels.length > CONFIG.maxIngredients && (
              <span style={{ fontSize: 11, opacity: 0.55 }}>
                {labels.length - CONFIG.maxIngredients} more ingredient{labels.length - CONFIG.maxIngredients === 1 ? '' : 's'} listed; only the first {CONFIG.maxIngredients} are shown as medallions.
              </span>
            )}
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={ed.active} onChange={(e) => patch({ active: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#c22b45' }} />
          Visible in the shop
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <button type="submit" disabled={busy} style={{ all: 'unset', cursor: busy ? 'wait' : 'pointer', ...adminPrimary, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Saving…' : 'Save bottle'}
          </button>
          <Btn onClick={close} disabled={busy} style={adminGhost} hoverStyle={{ borderColor: '#c22b45', color: '#c22b45' }}>
            Cancel
          </Btn>
        </div>
      </div>
    </form>
  );
}
