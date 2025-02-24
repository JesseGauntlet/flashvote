import Image from "next/image";
import { supabase } from '@/lib/supabase/config'
import type { Database } from '@/types/supabase'

type Event = Database['public']['Tables']['events']['Row']
type Item = Database['public']['Tables']['items']['Row']
type Subject = Database['public']['Tables']['subjects']['Row']
type Vote = Database['public']['Tables']['votes']['Row']

type EventMetadata = {
  description: string
}

type EventWithRelations = Event & {
  items?: (Item & {
    subjects?: (Subject & {
      votes?: Vote[]
    })[]
  })[]
  subjects?: (Subject & {
    votes?: Vote[]
  })[]
  metadata: EventMetadata | null
}

export default async function Home() {
  // Fetch event and related data
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      *,
      items (
        *,
        subjects (
          *,
          votes (*)
        )
      ),
      subjects (
        *,
        votes (*)
      )
    `)
    .eq('slug', 'demo')
    .single<EventWithRelations>()

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">FlashVote</h1>
        
        {eventError ? (
          <div className="p-4 bg-red-100 text-red-700 rounded-lg">
            Error loading event: {eventError.message}
          </div>
        ) : !event ? (
          <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg">
            No demo event found. Please run the seed script.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-6 bg-white shadow-lg rounded-lg">
              <h2 className="text-2xl font-semibold mb-4">{event.title}</h2>
              <p className="text-gray-600">{event.metadata?.description}</p>
            </div>

            {/* Global Subjects (not tied to items) */}
            {event.subjects?.filter(s => !s.item_id).map(subject => (
              <div key={subject.id} className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-xl font-medium mb-4">{subject.label}</h3>
                <div className="flex gap-4">
                  <div className="flex-1 p-4 bg-green-100 rounded-lg">
                    <p className="font-medium text-green-800">{subject.pos_label}</p>
                    <p className="text-2xl font-bold text-green-900">
                      {subject.votes?.filter(v => v.choice).length || 0} votes
                    </p>
                  </div>
                  <div className="flex-1 p-4 bg-red-100 rounded-lg">
                    <p className="font-medium text-red-800">{subject.neg_label}</p>
                    <p className="text-2xl font-bold text-red-900">
                      {subject.votes?.filter(v => !v.choice).length || 0} votes
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Items and their subjects */}
            {event.items?.map(item => (
              <div key={item.id} className="p-6 bg-white shadow-lg rounded-lg">
                <h3 className="text-xl font-semibold mb-4">{item.name}</h3>
                <div className="space-y-4">
                  {item.subjects?.map(subject => (
                    <div key={subject.id} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-lg font-medium mb-3">{subject.label}</h4>
                      <div className="flex gap-4">
                        <div className="flex-1 p-3 bg-green-100 rounded-lg">
                          <p className="font-medium text-green-800">{subject.pos_label}</p>
                          <p className="text-xl font-bold text-green-900">
                            {subject.votes?.filter(v => v.choice).length || 0} votes
                          </p>
                        </div>
                        <div className="flex-1 p-3 bg-red-100 rounded-lg">
                          <p className="font-medium text-red-800">{subject.neg_label}</p>
                          <p className="text-xl font-bold text-red-900">
                            {subject.votes?.filter(v => !v.choice).length || 0} votes
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
