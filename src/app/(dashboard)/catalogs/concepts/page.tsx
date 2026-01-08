import { getConcepts, getAreasForSelect } from '@/actions/concepts';
import { ConceptsClient } from './concepts-client';

export default async function ConceptsPage() {
    const [concepts, areas] = await Promise.all([
        getConcepts(),
        getAreasForSelect(),
    ]);

    return <ConceptsClient initialConcepts={concepts} areas={areas} />;
}
