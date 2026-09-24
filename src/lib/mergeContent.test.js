import { ui } from '../i18n/ui'
import { mergeContent } from './mergeContent'

const item = (over = {}) => ({
  id: 1,
  title_ar: 'عنوان',
  title_en: 'Title',
  body_ar: 'نص',
  body_en: 'Body',
  icon_key: null,
  ...over,
})

describe('without usable content', () => {
  test.each([
    ['null', null],
    ['undefined', undefined],
    ['a string', 'oops'],
    ['a number', 42],
    ['a boolean', true],
  ])('returns the built-in dictionary for %s', (_, content) => {
    expect(mergeContent('ar', content)).toBe(ui.ar)
    expect(mergeContent('en', content)).toBe(ui.en)
  })

  test('an empty payload leaves every text as built in', () => {
    expect(mergeContent('en', {})).toEqual(ui.en)
    expect(mergeContent('en', { texts: {}, collections: {} })).toEqual(ui.en)
    // PHP serialises empty arrays as [] rather than {}
    expect(mergeContent('en', { texts: [], collections: [] })).toEqual(ui.en)
  })

  test('falls back to Arabic for an unknown language', () => {
    expect(mergeContent('zz', null)).toBe(ui.ar)
  })

  test('a european locale renders from its own dictionary', () => {
    expect(mergeContent('fr', null)).toBe(ui.fr)
    expect(mergeContent('ru', null)).toBe(ui.ru)
  })
})

describe('the dashboard overlay stops at the two languages it speaks', () => {
  const texts = { heroBadge: { ar: 'شارة محدّثة', en: 'Updated badge' } }

  test('arabic and english take the edit', () => {
    expect(mergeContent('ar', { texts }).heroBadge).toBe('شارة محدّثة')
    expect(mergeContent('en', { texts }).heroBadge).toBe('Updated badge')
  })

  test('a european locale keeps its own wording instead of borrowing the english', () => {
    // Overlaying `en` here would put an English badge above a German headline. These thirty-nine
    // texts are the most visible on the site, so a whole-page language is worth the staleness.
    expect(mergeContent('de', { texts }).heroBadge).toBe(ui.de.heroBadge)
    expect(mergeContent('de', { texts }).heroBadge).not.toBe('Updated badge')
  })

  test('nor does a european locale take the collections', () => {
    const collections = { values: [{ title_ar: 'قيمة', title_en: 'Value', icon_key: 'quality' }] }
    expect(mergeContent('en', { collections }).values).toHaveLength(1)
    expect(mergeContent('it', { collections }).values).toBe(ui.it.values)
  })
})

describe('texts', () => {
  const texts = {
    heroBadge: { ar: 'شارة جديدة', en: 'New badge' },
    footRights: { ar: 'حقوق جديدة', en: 'New rights' },
  }

  test('a non-empty value in the current language replaces the built-in text', () => {
    const ar = mergeContent('ar', { texts })
    expect(ar.heroBadge).toBe('شارة جديدة')
    expect(ar.footRights).toBe('حقوق جديدة')

    const en = mergeContent('en', { texts })
    expect(en.heroBadge).toBe('New badge')
    expect(en.footRights).toBe('New rights')
  })

  test('keeps every other text as built in', () => {
    const en = mergeContent('en', { texts })
    expect(en.heroT1).toBe(ui.en.heroT1)
    expect(en.navHome).toBe(ui.en.navHome)
    expect(en.stats).toBe(ui.en.stats)
    expect(en.processSteps).toBe(ui.en.processSteps)
  })

  test('only the current language is used', () => {
    const merged = mergeContent('en', { texts: { heroBadge: { ar: 'عربي فقط', en: '' } } })
    expect(merged.heroBadge).toBe(ui.en.heroBadge)
  })

  test.each([
    ['an empty string', ''],
    ['whitespace only', '   \n'],
    ['null', null],
    ['undefined', undefined],
    ['a number', 7],
    ['a boolean', true],
    ['an object', { text: 'x' }],
    ['an array', ['x']],
  ])('ignores %s', (_, value) => {
    const merged = mergeContent('en', { texts: { heroBadge: { ar: 'x', en: value } } })
    expect(merged.heroBadge).toBe(ui.en.heroBadge)
  })

  test('ignores an entry that is not a language object', () => {
    const merged = mergeContent('en', { texts: { heroBadge: 'plain', heroT1: null, heroAccent: 5, heroSub: [] } })
    expect(merged.heroBadge).toBe(ui.en.heroBadge)
    expect(merged.heroT1).toBe(ui.en.heroT1)
    expect(merged.heroAccent).toBe(ui.en.heroAccent)
    expect(merged.heroSub).toBe(ui.en.heroSub)
  })

  test('ignores unknown keys', () => {
    const merged = mergeContent('en', { texts: { doesNotExist: { ar: 'a', en: 'b' } } })
    expect(merged).toEqual(ui.en)
    expect(merged).not.toHaveProperty('doesNotExist')
  })

  test('cannot replace list or object entries with a string, nor touch the prototype', () => {
    const payload = JSON.parse(`{"texts":{
      "stats":{"ar":"x","en":"x"},
      "cats":{"ar":"x","en":"x"},
      "processSteps":{"ar":"x","en":"x"},
      "socialMeta":{"ar":"x","en":"x"},
      "__proto__":{"ar":"x","en":"x"},
      "constructor":{"ar":"x","en":"x"},
      "toString":{"ar":"x","en":"x"}
    }}`)
    const merged = mergeContent('en', payload)
    expect(merged).toEqual(ui.en)
    expect(Object.getPrototypeOf(merged)).toBe(Object.prototype)
    expect({}.x).toBeUndefined()
  })

  test('keeps the value exactly as sent (no trimming, no escaping)', () => {
    const merged = mergeContent('en', { texts: { heroSub: { en: ' <b>Hello</b> & welcome ' } } })
    expect(merged.heroSub).toBe(' <b>Hello</b> & welcome ')
  })
})

describe('collections', () => {
  const collections = {
    process_steps: [
      item({ id: 1, title_ar: 'خطوة ١', title_en: 'Step 1', body_ar: 'وصف ١', body_en: 'Body 1' }),
      item({ id: 2, title_ar: 'خطوة ٢', title_en: 'Step 2', body_ar: 'وصف ٢', body_en: 'Body 2' }),
    ],
    values: [
      item({ id: 3, title_ar: 'الأمان', title_en: 'Safety', body_ar: null, body_en: null, icon_key: 'commit' }),
      item({ id: 4, title_ar: 'الرؤية', title_en: 'Vision', body_ar: null, body_en: null, icon_key: 'transparency' }),
    ],
    why_us: [
      item({ id: 5, title_ar: 'سبب ١', title_en: 'Reason 1', body_ar: 'شرح ١', body_en: 'Detail 1' }),
    ],
  }

  test('maps process_steps, values and why_us in Arabic', () => {
    const merged = mergeContent('ar', { collections })
    expect(merged.processSteps).toEqual([
      { t: 'خطوة ١', d: 'وصف ١' },
      { t: 'خطوة ٢', d: 'وصف ٢' },
    ])
    expect(merged.values).toEqual([
      { key: 'commit', t: 'الأمان' },
      { key: 'transparency', t: 'الرؤية' },
    ])
    expect(merged.whyus).toEqual([{ t: 'سبب ١', d: 'شرح ١' }])
  })

  test('maps process_steps, values and why_us in English', () => {
    const merged = mergeContent('en', { collections })
    expect(merged.processSteps).toEqual([
      { t: 'Step 1', d: 'Body 1' },
      { t: 'Step 2', d: 'Body 2' },
    ])
    expect(merged.values).toEqual([
      { key: 'commit', t: 'Safety' },
      { key: 'transparency', t: 'Vision' },
    ])
    expect(merged.whyus).toEqual([{ t: 'Reason 1', d: 'Detail 1' }])
  })

  test('keeps the order it was given', () => {
    const merged = mergeContent('en', {
      collections: { why_us: [item({ id: 9, title_en: 'B' }), item({ id: 2, title_en: 'A' })] },
    })
    expect(merged.whyus.map((w) => w.t)).toEqual(['B', 'A'])
  })

  test('each collection is independent', () => {
    const merged = mergeContent('en', { collections: { why_us: collections.why_us } })
    expect(merged.whyus).toEqual([{ t: 'Reason 1', d: 'Detail 1' }])
    expect(merged.processSteps).toBe(ui.en.processSteps)
    expect(merged.values).toBe(ui.en.values)
  })

  test('an empty or missing collection keeps the built-in list', () => {
    const merged = mergeContent('ar', { collections: { process_steps: [], values: [] } })
    expect(merged.processSteps).toBe(ui.ar.processSteps)
    expect(merged.values).toBe(ui.ar.values)
    expect(merged.whyus).toBe(ui.ar.whyus)
  })

  test('items without a title in the current language are skipped', () => {
    const list = [
      item({ id: 1, title_en: '', title_ar: 'أول' }),
      item({ id: 2, title_en: 'Second', title_ar: 'ثاني' }),
      item({ id: 3, title_en: '   ', title_ar: 'ثالث' }),
      item({ id: 4, title_en: null, title_ar: 'رابع' }),
    ]
    expect(mergeContent('en', { collections: { why_us: list } }).whyus).toEqual([{ t: 'Second', d: 'Body' }])
    expect(mergeContent('ar', { collections: { why_us: list } }).whyus.map((w) => w.t)).toEqual(['أول', 'ثاني', 'ثالث', 'رابع'])
  })

  test('keeps the built-in list when no item has a title in the current language', () => {
    const merged = mergeContent('en', { collections: { why_us: [item({ title_en: '' })] } })
    expect(merged.whyus).toBe(ui.en.whyus)
  })

  test('a missing body becomes an empty description', () => {
    const merged = mergeContent('en', {
      collections: { process_steps: [item({ body_en: null }), item({ body_en: undefined })] },
    })
    expect(merged.processSteps).toEqual([{ t: 'Title', d: '' }, { t: 'Title', d: '' }])
  })

  test('a value with a missing or unknown icon gets a valid default icon', () => {
    const merged = mergeContent('en', {
      collections: {
        values: [item({ icon_key: null }), item({ icon_key: 'nope' }), item({ icon_key: 'innovation' }), item({ icon_key: 5 })],
      },
    })
    expect(merged.values.map((v) => v.key)).toEqual(['quality', 'quality', 'innovation', 'quality'])
  })

  test('accepts a collection sent as an object keyed by position', () => {
    const merged = mergeContent('en', {
      collections: { process_steps: { 1: item({ title_en: 'Second' }), 2: item({ title_en: 'Third' }) } },
    })
    expect(merged.processSteps.map((s) => s.t)).toEqual(['Second', 'Third'])
  })

  test.each([
    ['null', null],
    ['a string', 'x'],
    ['a number', 3],
    ['a list of non-objects', [null, 'x', 5, [], true]],
  ])('ignores a collection that is %s', (_, value) => {
    const merged = mergeContent('en', { collections: { process_steps: value, values: value, why_us: value } })
    expect(merged.processSteps).toBe(ui.en.processSteps)
    expect(merged.values).toBe(ui.en.values)
    expect(merged.whyus).toBe(ui.en.whyus)
  })

  test('ignores unknown collections', () => {
    const merged = mergeContent('en', { collections: { faqs: [item()], stats: [item()] } })
    expect(merged).toEqual(ui.en)
  })
})

describe('robustness', () => {
  test('never throws on a malformed payload and falls back to the built-in text', () => {
    const payloads = [
      { texts: 'x', collections: 'y' },
      { texts: null, collections: null },
      { texts: 5, collections: [1, 2] },
      { texts: [{ ar: 'a' }], collections: { values: [null] } },
      { texts: { heroBadge: null }, collections: { process_steps: [{}] } },
      { texts: { heroBadge: { en: { nested: true } } }, collections: { why_us: [{ title_en: { a: 1 } }] } },
      [],
      [1, 2, 3],
      { data: { texts: { heroBadge: { en: 'wrapped one level too deep' } } } },
    ]
    for (const payload of payloads) {
      expect(() => mergeContent('en', payload)).not.toThrow()
      expect(mergeContent('en', payload)).toEqual(ui.en)
    }
  })

  test('does not mutate the built-in dictionary or the payload', () => {
    const snapshotUi = JSON.stringify(ui)
    const payload = {
      texts: { heroBadge: { ar: 'x', en: 'y' } },
      collections: { why_us: [item()], values: [item({ icon_key: 'commit' })], process_steps: [item()] },
    }
    const snapshotPayload = JSON.stringify(payload)

    mergeContent('ar', payload)
    mergeContent('en', payload)

    expect(JSON.stringify(ui)).toBe(snapshotUi)
    expect(JSON.stringify(payload)).toBe(snapshotPayload)
  })

  test('returns a new object each time it merges and leaves the built-in one alone', () => {
    const merged = mergeContent('en', { texts: { heroBadge: { en: 'Changed' } } })
    expect(merged).not.toBe(ui.en)
    expect(ui.en.heroBadge).toBe('Software & Tech Solutions Studio')
  })
})
