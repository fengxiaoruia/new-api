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
import {
  Brain,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  MessagesSquare,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StatusBadge, type StatusBadgeProps } from '@/components/status-badge'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

import type {
  LogChatMessage,
  LogChatResponse,
  LogConversation,
} from '../../types'
import { DetailSection } from './log-detail-layout'

function getRoleBadgeProps(
  role: string,
  t: (key: string) => string
): { label: string; variant: StatusBadgeProps['variant'] } {
  const normalized = role.toLowerCase().trim()
  switch (normalized) {
    case 'user':
      return { label: t('User'), variant: 'blue' }
    case 'assistant':
    case 'model':
      return { label: t('Assistant'), variant: 'purple' }
    case 'system':
      return { label: t('System'), variant: 'neutral' }
    case 'tool':
    case 'function':
      return { label: t('Tool'), variant: 'orange' }
    default:
      return { label: role || t('User'), variant: 'neutral' }
  }
}

function formatFullConversation(conversation: LogConversation): string {
  const parts: string[] = []

  if (conversation.messages && conversation.messages.length > 0) {
    for (const msg of conversation.messages) {
      const header = msg.name ? `${msg.role} (${msg.name})` : msg.role
      parts.push(`### ${header}\n${msg.content || ''}`)
    }
  }

  if (conversation.response) {
    const resp = conversation.response
    if (resp.reasoning_content) {
      parts.push(`### Assistant (Reasoning)\n${resp.reasoning_content}`)
    }
    if (resp.content) {
      parts.push(`### Assistant\n${resp.content}`)
    }
  }

  return parts.join('\n\n')
}

interface MessageItemProps {
  message: LogChatMessage
  index: number
}

function MessageItem({ message, index }: MessageItemProps) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const roleProps = getRoleBadgeProps(message.role, t)
  const isUser = message.role.toLowerCase() === 'user'
  const isSystem = message.role.toLowerCase() === 'system'
  const isTool =
    message.role.toLowerCase() === 'tool' ||
    message.role.toLowerCase() === 'function'

  return (
    <div
      className={cn(
        'group relative rounded-md border p-2.5 transition-colors',
        isUser &&
          'border-blue-200/60 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/20',
        isSystem && 'border-border/60 bg-muted/30',
        isTool &&
          'border-amber-200/60 bg-amber-50/20 dark:border-amber-900/40 dark:bg-amber-950/20',
        !isUser && !isSystem && !isTool && 'border-border/60 bg-background/60'
      )}
    >
      <div className='mb-1.5 flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          <StatusBadge
            label={roleProps.label}
            variant={roleProps.variant}
            size='sm'
            copyable={false}
          />
          {message.name && (
            <span className='text-muted-foreground font-mono text-[11px]'>
              ({message.name})
            </span>
          )}
          <span className='text-muted-foreground/60 font-mono text-[10px]'>
            #{index + 1}
          </span>
        </div>
        <Button
          variant='ghost'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-5 w-5 p-0'
          onClick={() => copyToClipboard(message.content)}
          title={t('Copy to clipboard')}
          aria-label={t('Copy to clipboard')}
        >
          {copiedText === message.content ? (
            <Check className='size-3 text-emerald-600' />
          ) : (
            <Copy className='size-3' />
          )}
        </Button>
      </div>
      <div className='text-xs leading-relaxed break-words whitespace-pre-wrap select-text'>
        {message.content}
      </div>
    </div>
  )
}

interface ResponseItemProps {
  response: LogChatResponse
}

function ResponseItem({ response }: ResponseItemProps) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })
  const [showReasoning, setShowReasoning] = useState(true)

  const copyText = response.content || ''

  return (
    <div className='border-purple-200/60 bg-purple-50/20 dark:border-purple-900/40 dark:bg-purple-950/20 rounded-md border p-2.5 transition-colors'>
      <div className='mb-2 flex items-center justify-between gap-2'>
        <div className='flex items-center gap-1.5'>
          <StatusBadge
            label={t('Assistant')}
            variant='purple'
            size='sm'
            copyable={false}
          />
        </div>
        {copyText && (
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-foreground h-5 w-5 p-0'
            onClick={() => copyToClipboard(copyText)}
            title={t('Copy to clipboard')}
            aria-label={t('Copy to clipboard')}
          >
            {copiedText === copyText ? (
              <Check className='size-3 text-emerald-600' />
            ) : (
              <Copy className='size-3' />
            )}
          </Button>
        )}
      </div>

      {/* Reasoning content (e.g. DeepSeek R1, o1, Claude 3.7 thought) */}
      {response.reasoning_content && (
        <div className='mb-2 rounded border border-dashed border-purple-300/50 bg-background/50 p-2 dark:border-purple-800/50'>
          <button
            type='button'
            className='text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-[11px] font-medium'
            onClick={() => setShowReasoning(!showReasoning)}
          >
            <span className='flex items-center gap-1.5 text-purple-600 dark:text-purple-400'>
              <Brain className='size-3.5' aria-hidden='true' />
              <span>{t('Reasoning Process')}</span>
            </span>
            {showReasoning ? (
              <ChevronDown className='size-3.5 text-muted-foreground' />
            ) : (
              <ChevronRight className='size-3.5 text-muted-foreground' />
            )}
          </button>
          {showReasoning && (
            <div className='text-muted-foreground mt-1.5 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap select-text'>
              {response.reasoning_content}
            </div>
          )}
        </div>
      )}

      {/* Normal Content */}
      {response.content ? (
        <div className='text-xs leading-relaxed break-words whitespace-pre-wrap select-text'>
          {response.content}
        </div>
      ) : (
        !response.reasoning_content && (
          <div className='text-muted-foreground text-xs italic'>-</div>
        )
      )}
    </div>
  )
}

interface ConversationDetailSectionProps {
  conversation: LogConversation
}

export function ConversationDetailSection({
  conversation,
}: ConversationDetailSectionProps) {
  const { t } = useTranslation()
  const { copiedText, copyToClipboard } = useCopyToClipboard({ notify: false })

  const hasMessages =
    conversation.messages && conversation.messages.length > 0
  const hasResponse = Boolean(
    conversation.response &&
      (conversation.response.content || conversation.response.reasoning_content)
  )

  if (!hasMessages && !hasResponse) {
    return null
  }

  const fullText = formatFullConversation(conversation)
  const isFullCopied = copiedText === fullText

  return (
    <DetailSection
      icon={<MessagesSquare className='size-3.5' aria-hidden='true' />}
      iconTone='info'
      label={t('Conversation Details')}
    >
      <div className='flex items-center justify-end pb-1'>
        <Button
          variant='outline'
          size='sm'
          className='h-6 gap-1 px-2 text-[11px]'
          onClick={() => copyToClipboard(fullText)}
          title={t('Copy conversation')}
        >
          {isFullCopied ? (
            <Check className='size-3 text-emerald-600' />
          ) : (
            <Copy className='size-3' />
          )}
          <span>{isFullCopied ? t('Conversation copied') : t('Copy conversation')}</span>
        </Button>
      </div>

      <div className='max-h-[480px] space-y-2 overflow-y-auto pr-1'>
        {hasMessages &&
          conversation.messages!.map((msg, index) => (
            <MessageItem
              key={`msg-${index}-${msg.role}`}
              message={msg}
              index={index}
            />
          ))}

        {hasResponse && conversation.response && (
          <ResponseItem response={conversation.response} />
        )}
      </div>
    </DetailSection>
  )
}
