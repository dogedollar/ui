import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Transition, animated } from 'react-spring'
import { GU, springs, textStyle } from '../../style'
import { useTheme } from '../../theme'
import { useLayout } from '../Layout/Layout'
import { Checkbox } from '../Input/Checkbox'
import { ToggleButton } from './ToggleButton'
import { OpenedSurfaceBorder } from './OpenedSurfaceBorder'

// Table head row
function cellsFromFields(
  fields,
  { hasAnyActions, hasAnyExpansion, selectContent, selectable }
) {
  const cells = fields.map((field, index) => [
    field.label,
    field.align === 'end' ? 'right' : 'left',
  ])

  if (hasAnyExpansion || selectable) {
    cells.unshift([selectable ? selectContent : null, 'left'])
  }

  if (hasAnyActions) {
    cells.push([null, 'left'])
  }

  return cells
}

// Table content row
function rowFromEntry(
  entry,
  {
    fields,
    hasAnyActions,
    hasAnyExpansion,
    opened,
    selectContent,
    selectable,
    toggleChildContent,
  }
) {
  const hasExpansion = entry.expansion.content.length > 0

  const cells = entry.entryNodes.map((content, index) => [
    content,
    fields[index].align,
    false,
  ])

  // Checkbox
  if (selectable) {
    cells.unshift([selectContent, 'start', true])
  }

  // Toggle child
  if (!selectable && hasAnyExpansion) {
    cells.unshift([hasExpansion && toggleChildContent, 'start', true])
  }

  // Actions
  if (hasAnyActions) {
    cells.push([entry.actions, 'end', true])
  }

  return {
    cells,
    entry,
    hasExpansion,
    opened,
  }
}

function TableView({
  alignChildOnField,
  allSelected,
  entries,
  fields,
  hasAnyActions,
  hasAnyExpansion,
  onSelect,
  onSelectAll,
  renderSelectionCount,
  rowHeight,
  selectable,
  selectedCount,
}) {
  const [opened, setOpened] = useState(-1)

  const toggleEntry = useCallback(index => {
    setOpened(opened => (opened === index ? -1 : index))
  }, [])

  const headCells = useMemo(
    () =>
      cellsFromFields(fields, {
        hasAnyActions,
        hasAnyExpansion,
        selectContent: (
          <Checkbox
            indeterminate={allSelected === 0}
            checked={allSelected > -1}
            onChange={onSelectAll}
          />
        ),
        selectable,
      }),
    [fields, hasAnyExpansion, hasAnyActions]
  )

  const entryRows = useMemo(
    () =>
      entries.map(entry => {
        const rowOpened = opened === entry.index
        return rowFromEntry(entry, {
          fields,
          hasAnyActions,
          hasAnyExpansion,
          opened: rowOpened,
          toggleChildContent: hasAnyExpansion ? (
            <Toggle
              index={entry.index}
              opened={rowOpened}
              onToggle={toggleEntry}
            />
          ) : null,
          selectable,
          selectContent: selectable ? (
            <Select
              index={entry.index}
              selected={entry.selected}
              onSelect={onSelect}
            />
          ) : null,
        })
      }),
    [
      entries,
      fields,
      hasAnyActions,
      hasAnyExpansion,
      onSelect,
      opened,
      selectable,
      toggleEntry,
    ]
  )

  useEffect(() => {
    setOpened(false)
  }, [entries, fields])

  return (
    <table
      css={`
        width: 100%;
        border-spacing: 0;
        border-collapse: separate;
      `}
    >
      <thead>
        <HeadRow
          cells={headCells}
          selectedCount={selectedCount}
          renderSelectionCount={renderSelectionCount}
        />
      </thead>
      <tbody>
        {entryRows.map(({ cells, entry, hasExpansion, opened }, index) => (
          <React.Fragment key={entry.index}>
            <EntryRow
              cells={cells}
              rowHeight={rowHeight}
              selected={entry.selected}
            />
            {hasExpansion && (
              <EntryExpansion
                alignChildOnCell={alignChildOnField + 1}
                cellsCount={cells.length}
                expansion={entry.expansion}
                opened={opened}
                rowHeight={rowHeight}
              />
            )}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  )
}

TableView.propTypes = {
  alignChildOnField: PropTypes.number.isRequired,
  allSelected: PropTypes.oneOf([-1, 0, 1]).isRequired,
  entries: PropTypes.array.isRequired,
  fields: PropTypes.array.isRequired,
  hasAnyActions: PropTypes.bool.isRequired,
  hasAnyExpansion: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  renderSelectionCount: PropTypes.func.isRequired,
  rowHeight: PropTypes.number.isRequired,
  selectable: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
}

// Disable prop types check for internal components
/* eslint-disable react/prop-types */

function useSidePadding() {
  const { layoutName } = useLayout()
  return layoutName === 'small' ? 2 * GU : 3 * GU
}

function HeadRow({ cells, selectedCount, renderSelectionCount }) {
  const theme = useTheme()
  const sidePadding = useSidePadding()
  return (
    <tr>
      {cells.map((cell, index) => {
        const hidden = selectedCount > 0 && index > 1
        const content =
          selectedCount > 0 && index === 1
            ? renderSelectionCount(selectedCount)
            : cell[0]
        return (
          !hidden && (
            <th
              key={index}
              css={`
                height: ${4 * GU}px;
                padding: 0;
                padding-left: ${index === 0 ? sidePadding : 0}px;
                padding-right: ${index === cells.length - 1
                  ? sidePadding
                  : 0}px;
                text-align: ${cell[1]};
                ${textStyle('label2')};
                color: ${theme.surfaceContentSecondary};
              `}
              colSpan={selectedCount > 0 && index === 1 ? cells.length - 1 : 1}
            >
              {content}
            </th>
          )
        )
      })}
    </tr>
  )
}

function EntryRow({ cells, selected, rowHeight }) {
  const theme = useTheme()
  const sidePadding = useSidePadding()
  return (
    <tr
      css={`
        transition: background 150ms ease-in-out;
        background: ${selected ? theme.surfaceSelected : 'none'};
      `}
    >
      {cells.map(([content, align, compact], index, cells) => {
        const first = index === 0
        const last = index === cells.length - 1
        return (
          <td
            key={index}
            css={`
              position: relative;
              width: ${compact ? 0 : 'auto'};
              height: ${rowHeight}px;
              padding-top: 0;
              padding-bottom: 0;
              padding-left: ${first || compact ? sidePadding : 0}px;
              padding-right: ${(!first && (align !== 'end' || last)) || compact
                ? sidePadding
                : 0}px;
              border-top: 1px solid ${theme.border};
            `}
          >
            <div
              css={`
                display: flex;
                width: 100%;
                justify-content: ${`flex-${align}`};
              `}
            >
              {content}
            </div>
          </td>
        )
      })}
    </tr>
  )
}

function EntryExpansion({
  alignChildOnCell,
  cellsCount,
  expansion,
  opened,
  rowHeight,
}) {
  const theme = useTheme()

  // Handles the height of the expansion in free layout mode
  const [freeLayoutContentHeight, setFreeLayoutContentHeight] = useState(0)

  const handleFreeLayoutContentRef = useCallback(element => {
    if (element) {
      setFreeLayoutContentHeight(element.getBoundingClientRect().height)
    }
  }, [])

  const height = expansion.freeLayout
    ? freeLayoutContentHeight
    : rowHeight * expansion.content.length

  return (
    <Transition
      native
      unique
      items={opened}
      from={{ height: 0 }}
      enter={{ height }}
      update={{ height }}
      leave={{ height: 0 }}
      config={{ ...springs.smooth, precision: 0.1 }}
    >
      {show =>
        show &&
        (({ height }) => (
          <tr
            css={`
              td {
                position: relative;
                padding: 0;
                box-shadow: inset 0 6px 4px -4px rgba(0, 0, 0, 0.16);
                background: ${theme.surfaceUnder};
              }
            `}
          >
            {alignChildOnCell > 0 && (
              <td colSpan={alignChildOnCell}>
                <OpenedSurfaceBorder opened={opened} />
                <animated.div css="overflow: hidden" style={{ height }}>
                  {expansion.content.map((child, i) => (
                    <div
                      key={i}
                      css={`
                        height: ${expansion.freeLayout
                          ? 'auto'
                          : `${rowHeight}px`};
                        border-top: 1px solid ${theme.border};
                      `}
                    />
                  ))}
                </animated.div>
              </td>
            )}
            <td
              colSpan={
                alignChildOnCell === -1
                  ? cellsCount
                  : cellsCount - alignChildOnCell
              }
            >
              <animated.div css="overflow: hidden" style={{ height }}>
                {expansion.content.map((child, i) => (
                  <div
                    key={i}
                    ref={
                      expansion.freeLayout ? handleFreeLayoutContentRef : null
                    }
                    css={`
                      display: flex;
                      align-items: center;
                      height: ${expansion.freeLayout
                        ? 'auto'
                        : `${rowHeight}px`};
                      padding-left: ${alignChildOnCell < 1 ? 3 * GU : 0}px;
                      padding-right: ${3 * GU}px;
                      border-top: 1px solid ${theme.border};
                    `}
                  >
                    {child}
                  </div>
                ))}
              </animated.div>
            </td>
          </tr>
        ))
      }
    </Transition>
  )
}

function Select({ index, selected, onSelect }) {
  const change = useCallback(
    check => {
      onSelect(index, check)
    },
    [index, onSelect]
  )

  return <Checkbox onChange={change} checked={selected} />
}

function Toggle({ index, opened, onToggle }) {
  const toggle = useCallback(() => {
    onToggle(index)
  }, [index, onToggle])

  return (
    <div
      css={`
        width: 100%;
        height: 100%;
      `}
    >
      <OpenedSurfaceBorder opened={opened} />
      <ToggleButton opened={opened} onClick={toggle} />
    </div>
  )
}

/* eslint-enable react/prop-types */

export { TableView }