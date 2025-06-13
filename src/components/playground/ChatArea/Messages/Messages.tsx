import type { PlaygroundChatMessage } from '@/types/playground'

import { AgentMessage, UserMessage } from './MessageItem'
import Tooltip from '@/components/ui/tooltip'
import { memo } from 'react'
import {
  ToolCallProps,
  ReasoningStepProps,
  ReasoningProps,
  ReferenceData,
  Reference
} from '@/types/playground'
import React, { type FC } from 'react'
import { useState, useEffect } from 'react'
import ChatBlankState from './ChatBlankState'
import Icon from '@/components/ui/icon'

interface MessageListProps {
  messages: PlaygroundChatMessage[]
}

interface MessageWrapperProps {
  message: PlaygroundChatMessage
  isLastMessage: boolean
}

interface ReferenceProps {
  references: ReferenceData[]
}

interface ReferenceItemProps {
  reference: Reference
}

const ReferenceItem: FC<ReferenceItemProps> = ({ reference }) => (
  <div className="relative flex h-[63px] w-[190px] cursor-default flex-col justify-between overflow-hidden rounded-md bg-background-secondary p-3 transition-colors hover:bg-background-secondary/80">
    <p className="text-sm font-medium text-primary">{reference.name}</p>
    <p className="truncate text-xs text-primary/40">{reference.content}</p>
  </div>
)

const References: FC<ReferenceProps> = ({ references }) => (
  <div className="flex flex-col gap-4">
    {references.map((referenceData, index) => (
      <div
        key={`${referenceData.query}-${index}`}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-wrap gap-3">
          {referenceData.references.map((reference, refIndex) => (
            <ReferenceItem
              key={`${reference.name}-${reference.meta_data.chunk}-${refIndex}`}
              reference={reference}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)

const AgentMessageWrapper = ({ message }: MessageWrapperProps) => {
  console.log('AgentMessageWrapper', message.tool_calls)
  const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(null);
  useEffect(() => {
    setSelectedToolIndex(null);
  }, [message]);
  const handleToolClick = (index: number) => {
    setSelectedToolIndex(prevIndex => (prevIndex === index ? null : index));
  };
  return (
    <div className="flex flex-col gap-y-9">
      {message.extra_data?.reasoning_steps &&
        message.extra_data.reasoning_steps.length > 0 && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">Reasoning</p>}
              side="top"
            >
              <Icon type="reasoning" size="sm" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <p className="text-xs uppercase">Reasoning</p>
              <Reasonings reasoning={message.extra_data.reasoning_steps} />
            </div>
          </div>
        )}
      {message.extra_data?.references &&
        message.extra_data.references.length > 0 && (
          <div className="flex items-start gap-4">
            <Tooltip
              delayDuration={0}
              content={<p className="text-accent">References</p>}
              side="top"
            >
              <Icon type="references" size="sm" />
            </Tooltip>
            <div className="flex flex-col gap-3">
              <References references={message.extra_data.references} />
            </div>
          </div>
        )}
      {message.tool_calls && message.tool_calls.length > 0 && (
        <div>
    {/* Row: hammer icon + tool chips */}
    <div className="flex items-center gap-3 w-full">
      <Tooltip
        delayDuration={0}
        content={<p className="text-accent">Tool Calls</p>}
        side="top"
      >
        <Icon
          type="hammer"
          className="rounded-lg bg-background-secondary p-1"
          size="sm"
          color="secondary"
        />
      </Tooltip>
      <div className="flex flex-wrap gap-2 rounded-md flex-1">
        {message.tool_calls.map((toolCall, index) => (
          <ToolComponent
            key={toolCall.tool_call_id || `${toolCall.tool_name}-${toolCall.created_at}-${index}`}
            tools={toolCall}
            onClick={() => handleToolClick(index)}
          />
        ))}
      </div>
    </div>
    {/* Row: tool arguments, aligned with tool chips */}
    {selectedToolIndex !== null &&
      message.tool_calls[selectedToolIndex] &&
      message.tool_calls[selectedToolIndex].tool_args && (
        <div className="flex w-full">
          {/* Empty space for icon and gap */}
          <div style={{ width: 40 /* icon size + gap, adjust as needed */ }} />
          <div className="mt-2 rounded bg-background-secondary p-2 text-xs text-primary flex-1">
            {Object.entries(message.tool_calls[selectedToolIndex].tool_args).map(([arg, value], i) => {
              // Map argument keys to display names
              const argDisplayMap: Record<string, string> = {
                member_id: 'Agent Name',
                task_description: 'Task Description',
                expected_output: 'Expected Output',
              };
              // Use mapped name or prettify the key
              const displayArg = argDisplayMap[arg] || arg.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

              // Format value (optional: prettify objects/arrays)
              const displayValue = typeof value === "object" && value !== null
                ? JSON.stringify(value)
                : String(value);

              return (
                <div key={`${selectedToolIndex}-${arg}-${String(value)}-${i}`}>
                  <strong><span className="text-green-500">{displayArg}: </span></strong> {displayValue}
                </div>
              );
            })}
          </div>
        </div>
    )}
  </div>
      )}
      <AgentMessage message={message} />
    </div>
  )
}
const Reasoning: FC<ReasoningStepProps> = ({ index, stepTitle }) => (
  <div className="flex items-center gap-2 text-secondary">
    <div className="flex h-[20px] items-center rounded-md bg-background-secondary p-2">
      <p className="text-xs">STEP {index + 1}</p>
    </div>
    <p className="text-xs">{stepTitle}</p>
  </div>
)
const Reasonings: FC<ReasoningProps> = ({ reasoning }) => (
  <div className="flex flex-col items-start justify-center gap-2">
    {reasoning.map((title, index) => (
      <Reasoning
        key={`${title.title}-${title.action}-${index}`}
        stepTitle={title.title}
        index={index}
      />
    ))}
  </div>
)

const ToolComponent = memo(
  ({ tools, onClick }: ToolCallProps & { onClick?: () => void }) => (
    <div
      className="cursor-pointer rounded-md bg-accent px-2 py-1.5 text-xs"
      onClick={onClick}
    >
      <p className="font-dmmono uppercase text-primary/80">{tools.tool_args.member_id ? tools.tool_args.member_id : tools.tool_name}</p>
    </div>
  )
);
ToolComponent.displayName = 'ToolComponent';
const Messages = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return <ChatBlankState />
  }

  return (
    <>
      {messages.map((message, index) => {
        const key = `${message.role}-${message.created_at}-${index}`
        const isLastMessage = index === messages.length - 1

        if (message.role === 'agent') {
          return (
            <AgentMessageWrapper
              key={key}
              message={message}
              isLastMessage={isLastMessage}
            />
          )
        }
        return <UserMessage key={key} message={message} />
      })}
    </>
  )
}

export default Messages
