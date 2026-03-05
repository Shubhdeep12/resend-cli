# typed: false
# frozen_string_literal: true

class ResendCli < Formula
  desc "CLI for Resend (resend.com)"
  homepage "https://github.com/Shubhdeep12/resend-cli"
  url "https://registry.npmjs.org/@shubhdeep12/resend-cli/-/resend-cli-0.4.12.tgz"
  sha256 "f9fae8923dcb26f998d55a33ab280b2d5465bac61efd08e1a883bac940e38d81"
  license "MIT"

  depends_on "node"

  def install
    (buildpath/"package").cd do
      system "npm", "install", *Language::Node.std_npm_args(libexec)
    end
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    assert_match "resend", shell_output("#{bin}/resend --help")
  end
end
