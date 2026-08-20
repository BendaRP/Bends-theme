#!/usr/bin/env ruby
# Parse every Liquid file with the real Liquid engine.
#
# `shopify theme check` is static analysis — it never compiles the template, so
# a filter used inside an `if` condition, or a malformed tag argument, sails
# past it and only fails when a shopper loads the page. This does the real parse.
require 'liquid'

# The theme ships Hebrew content, so every file must be read as UTF-8.
Encoding.default_external = Encoding::UTF_8
Encoding.default_internal = Encoding::UTF_8

env = Liquid::Environment.build do |e|
  # Shopify's own tags are not part of the Liquid gem. `style` has its body
  # parsed as Liquid by Shopify, so it stays a real block; `form` and
  # `paginate` likewise. Their tag arguments use Shopify-specific syntax that
  # base Liquid cannot validate, so those are linted separately below.
  passthrough_block = Class.new(Liquid::Block)
  passthrough_tag = Class.new(Liquid::Tag)

  %w[style form paginate].each { |name| e.register_tag(name, passthrough_block) }
  %w[section sections layout content_for].each { |name| e.register_tag(name, passthrough_tag) }

  # Shopify allows `{% render block %}` for app blocks, which base Liquid
  # rejects because the template name is not a quoted string.
  e.register_tag('render', Class.new(Liquid::Render) do
    def initialize(tag_name, markup, options)
      markup.strip == 'block' ? super(tag_name, "'app-block'", options) : super
    end
  end)
end

# Shopify's form and paginate tags read their arguments with a simpler parser
# than an expression. A filter in there is silently mis-read — a form ends up
# with the wrong type, which is only visible once the page renders.
FILTERED_TAG_ARGS = /\{%-?\s*(form|paginate)\s+[^%]*\|/

# Blocks Shopify treats as raw. Blanked before parsing, preserving line count so
# reported line numbers still match the file.
RAW_BLOCKS = %w[schema javascript stylesheet doc].freeze

def blank_raw_blocks(source)
  RAW_BLOCKS.reduce(source) do |text, name|
    text.gsub(/\{%-?\s*#{name}\s*-?%\}.*?\{%-?\s*end#{name}\s*-?%\}/m) { |m| "\n" * m.count("\n") }
  end
end

failures = []
count = 0

Dir.glob('{layout,sections,snippets,templates,blocks}/**/*.liquid').sort.each do |path|
  count += 1
  source = File.read(path, encoding: 'UTF-8')

  source.each_line.with_index(1) do |line, number|
    next unless line =~ FILTERED_TAG_ARGS
    failures << "#{path}:#{number}: filter used in a #{$1} tag argument — assign it first"
  end

  begin
    Liquid::Template.parse(blank_raw_blocks(source), environment: env, error_mode: :strict)
  rescue Liquid::Error => e
    line = e.line_number ? ":#{e.line_number}" : ''
    failures << "#{path}#{line}: #{e.message.sub(/\ALiquid syntax error(?: \(line \d+\))?: /, '')}"
  end
end

puts "parsed #{count} Liquid files, #{failures.size} failed"
failures.each { |f| puts "  #{f}" }
exit(failures.empty? ? 0 : 1)
