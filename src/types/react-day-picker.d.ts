import type * as React from "react"
import type { ClassNames, DayPickerProps } from "react-day-picker"

import "react-day-picker"

type DayPickerPropsWithTableClassName = Omit<DayPickerProps, "classNames"> & {
  classNames?: Partial<ClassNames> & {
    table?: string
  }
}

declare module "react-day-picker" {
  function DayPicker(
    initialProps: DayPickerPropsWithTableClassName
  ): React.JSX.Element
}
