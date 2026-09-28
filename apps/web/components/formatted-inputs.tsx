"use client"

import { useState } from "react"

import { Input } from "@workspace/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@workspace/ui/components/input-group"

import { formatDecimalInput, formatPhone } from "@/lib/format"

type InputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> & { defaultValue?: string }

/** Brazilian phone number with the `(24) 99999-9999` mask. */
export function PhoneInput({ defaultValue = "", ...props }: InputProps) {
  const [value, setValue] = useState(() => formatPhone(defaultValue))

  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      placeholder="(24) 99999-9999"
      pattern="\(\d{2}\) \d{4,5}-\d{4}"
      title="Informe o DDD e o número, ex.: (24) 99999-9999"
      {...props}
      value={value}
      onChange={(event) => setValue(formatPhone(event.target.value))}
    />
  )
}

/** Decimal number in pt-BR notation (`72,5`) with a unit suffix. */
export function DecimalInput({
  unit,
  decimals = 1,
  integerDigits = 3,
  defaultValue = "",
  ...props
}: Omit<InputProps, "defaultValue"> & {
  unit: string
  decimals?: number
  integerDigits?: number
  defaultValue?: string
}) {
  const [value, setValue] = useState(defaultValue)

  return (
    <InputGroup>
      <InputGroupInput
        type="text"
        inputMode={decimals > 0 ? "decimal" : "numeric"}
        {...props}
        value={value}
        onChange={(event) =>
          setValue(
            formatDecimalInput(event.target.value, { decimals, integerDigits })
          )
        }
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>{unit}</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
