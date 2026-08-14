import * as React from "react"

export const Card = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 ${className}`} {...props} />
)
Card.displayName = "Card"

export const CardHeader = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex flex-col space-y-1.5 p-6 border-b border-gray-50 ${className}`} {...props} />
)
CardHeader.displayName = "CardHeader"

export const CardTitle = ({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight text-gray-900 ${className}`} {...props} />
)
CardTitle.displayName = "CardTitle"

export const CardDescription = ({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={`text-sm text-gray-500 ${className}`} {...props} />
)
CardDescription.displayName = "CardDescription"

export const CardContent = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 pt-6 ${className}`} {...props} />
)
CardContent.displayName = "CardContent"

export const CardFooter = ({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`flex items-center p-6 pt-0 border-t border-gray-50 mt-4 ${className}`} {...props} />
)
CardFooter.displayName = "CardFooter"
