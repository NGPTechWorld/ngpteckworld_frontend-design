import ar from './locales/ar.js'
import de from './locales/de.js'
import en from './locales/en.js'
import es from './locales/es.js'
import fr from './locales/fr.js'
import it from './locales/it.js'
import nl from './locales/nl.js'
import pt from './locales/pt.js'
import ru from './locales/ru.js'
import tr from './locales/tr.js'

/**
 * Every interface string the public site renders, keyed by language.
 *
 * One file per language under ./locales — the dictionary is a few hundred entries and ten
 * languages of it in a single file was unreadable and impossible to diff. The keys of each file
 * are identical by contract, and ui.test.js fails the build if one of them drifts, which is the
 * only thing standing between a missed key and a blank heading on a page nobody on the team reads.
 *
 * This is interface copy only. Services, projects, team members, testimonials and FAQs come from
 * the database, which stores Arabic and English and nothing else; see ./languages.js for how the
 * European locales borrow English for those.
 */
export const ui = { ar, en, de, es, fr, it, nl, pt, ru, tr }
