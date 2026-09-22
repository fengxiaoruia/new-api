/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, test } from 'vitest'

import type { UsageLog } from '../../data/schema'
import type { LogOtherData } from '../../types'
import { DetailsDialog } from '../dialogs/details-dialog'

const queryClients: QueryClient[] = []

function makeLog(other: LogOtherData): UsageLog {
  return {
    id: 1,
    user_id: 1,
    created_at: 1,
    type: 2,
    content: '',
    username: 'user',
    token_name: 'token',
    model_name: 'gpt-4o',
    quota: 100,
    prompt_tokens: 10,
    completion_tokens: 20,
    use_time: 1,
    is_stream: false,
    channel: 1,
    channel_name: 'openai-channel',
    token_id: 1,
    group: 'default',
    ip: '',
    other: JSON.stringify(other),
    request_id: 'req-1',
    upstream_request_id: '',
  }
}

function renderDetails(isAdmin: boolean, isRoot: boolean): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const freshAt = Date.now() + 60_000
  queryClient.setQueryData(['status'], {}, { updatedAt: freshAt })
  queryClients.push(queryClient)

  render(
    <QueryClientProvider client={queryClient}>
      <DetailsDialog
        log={makeLog({
          admin_info: {
            conversation: {
              messages: [
                { role: 'user', content: 'Explain quantum computing.' },
              ],
              response: {
                role: 'assistant',
                content: 'Quantum computing uses qubits.',
                reasoning_content: 'Thinking about quantum superposition...',
              },
            },
          },
        })}
        isAdmin={isAdmin}
        isRoot={isRoot}
        open
        onOpenChange={() => undefined}
      />
    </QueryClientProvider>
  )
}

afterEach(() => {
  for (const queryClient of queryClients) {
    queryClient.clear()
  }
  queryClients.length = 0
})

describe('usage log conversation detail visibility', () => {
  test('shows conversation details to admin users', () => {
    renderDetails(true, false)

    expect(screen.getByText('Conversation Details')).toBeInTheDocument()
    expect(screen.getByText('Explain quantum computing.')).toBeInTheDocument()
    expect(screen.getByText('Quantum computing uses qubits.')).toBeInTheDocument()
    expect(
      screen.getByText('Thinking about quantum superposition...')
    ).toBeInTheDocument()
  })

  test('shows conversation details to root users', () => {
    renderDetails(false, true)

    expect(screen.getByText('Conversation Details')).toBeInTheDocument()
    expect(screen.getByText('Explain quantum computing.')).toBeInTheDocument()
    expect(screen.getByText('Quantum computing uses qubits.')).toBeInTheDocument()
  })

  test('hides conversation details from non-admin and non-root users', () => {
    renderDetails(false, false)

    expect(screen.queryByText('Conversation Details')).toBeNull()
    expect(screen.queryByText('Explain quantum computing.')).toBeNull()
    expect(screen.queryByText('Quantum computing uses qubits.')).toBeNull()
  })
})
